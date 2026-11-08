"use client";

import { Menu, Settings2 } from "lucide-react";

import { ModelSelector } from "@/components/chat/model-selector";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { UserMenu } from "@/components/settings/user-menu";
import { IconButton } from "@/components/ui/icon-button";

interface ChatHeaderProps {
  title: string;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export function ChatHeader({
  title,
  onOpenSidebar,
  onOpenSettings,
  onOpenProfile,
}: ChatHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="flex min-h-14 items-center gap-1.5 px-2 py-1.5 sm:px-4">
        <IconButton label="Open conversation history" onClick={onOpenSidebar} className="lg:hidden">
          <Menu aria-hidden="true" size={19} />
        </IconButton>

        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-sm font-semibold" title={title}>
            {title}
          </p>
          <p className="hidden text-[0.625rem] text-muted sm:block">
            Stored on this device
          </p>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <ModelSelector />
        </div>

        <ThemeToggle />
        <IconButton
          label="Open settings"
          onClick={onOpenSettings}
          className="hidden sm:inline-flex"
        >
          <Settings2 aria-hidden="true" size={17} />
        </IconButton>
        <UserMenu onOpenSettings={onOpenSettings} onOpenProfile={onOpenProfile} />
      </div>

      {/* On phones/tablets the model control gets its own row so the header
          never forces horizontal scrolling on a narrow Android screen. */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-2 lg:hidden">
        <span className="hidden text-xs font-medium text-muted sm:inline">Model</span>
        <ModelSelector />
      </div>
    </header>
  );
}
