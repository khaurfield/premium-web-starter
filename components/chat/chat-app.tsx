"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Brand } from "@/components/brand";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ConversationSidebarContent } from "@/components/chat/chat-sidebar";
import { useApp } from "@/components/providers/app-provider";
import { ProfileDialog } from "@/components/settings/profile-dialog";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DrawerContent,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { useChat, type SendInput } from "@/hooks/use-chat";
import type { ChatMessage } from "@/lib/client/conversations";

const EMPTY_MESSAGES: ChatMessage[] = [];

export function ChatApp() {
  const {
    hydrated,
    storageError,
    preferences,
    activeConversation,
    createConversation,
    updateMessages,
    catalog,
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (hydrated && !activeConversation) createConversation();
  }, [hydrated, activeConversation, createConversation]);

  const messages = activeConversation?.messages ?? EMPTY_MESSAGES;
  const chat = useChat({
    conversationId: activeConversation?.id ?? null,
    messages,
    updateMessages,
    preferences,
    model: preferences.defaultModel ?? undefined,
  });

  const handleSend = (input: SendInput) => chat.send(input);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Desktop rail */}
      <aside className="hidden w-[17.5rem] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <Brand href="/" />
        </div>
        <ConversationSidebarContent />
      </aside>

      {/* Mobile / tablet drawer */}
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent>
          <DialogTitle className="sr-only">Conversation history</DialogTitle>
          <DialogDescription className="sr-only">
            Browse, search, rename or delete conversations stored on this device.
          </DialogDescription>
          <div className="flex h-full flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
              <Brand href="/" />
              <DialogClose asChild>
                <IconButton label="Close conversation history">
                  <X aria-hidden="true" size={18} />
                </IconButton>
              </DialogClose>
            </div>
            <ConversationSidebarContent
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </DrawerContent>
      </Dialog>

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={activeConversation?.title ?? "New conversation"}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <ChatMessages
          messages={messages}
          error={chat.error}
          storageError={storageError}
          onRetry={chat.retry}
          onClearError={chat.clearError}
          onSuggestion={setDraft}
        />

        <ChatComposer
          draft={draft}
          setDraft={setDraft}
          onSend={handleSend}
          onStop={chat.stop}
          status={chat.status}
          preferences={preferences}
          catalog={catalog}
        />
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
