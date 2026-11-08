"use client";

import {
  Clock3,
  MessageSquare,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function shortDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}/.exec(iso)?.[0] ?? "";
}

interface ConversationSidebarProps {
  onNavigate?: () => void;
}

export function ConversationSidebarContent({
  onNavigate,
}: ConversationSidebarProps) {
  const {
    hydrated,
    conversations,
    store,
    selectConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    catalog,
  } = useApp();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? conversations.filter((item) => item.title.toLowerCase().includes(needle))
      : conversations;
  }, [conversations, query]);

  const providerConfigured =
    catalog.status === "ready" ? catalog.data.configured : null;

  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 scrollbar-thin">
        <Button
          className="w-full justify-start"
          onClick={() => {
            createConversation();
            onNavigate?.();
          }}
        >
          <MessageSquarePlus aria-hidden="true" size={16} /> New conversation
        </Button>

        <div className="relative">
          <Search
            aria-hidden="true"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            aria-label="Search conversations"
            placeholder="Search conversations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 pl-9 text-sm"
          />
        </div>

        {!hydrated ? (
          <p className="px-2 py-6 text-center text-xs text-muted">
            Loading local history…
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted">
            {conversations.length === 0
              ? "No conversations yet. Start one above."
              : "No conversations match your search."}
          </p>
        ) : (
          <ul className="space-y-1" aria-label="Conversation history">
            {filtered.map((conversation) => {
              const active = conversation.id === store.activeId;
              const editing = editingId === conversation.id;
              return (
                <li key={conversation.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-xl border border-transparent px-1 transition-colors",
                      active
                        ? "border-primary/20 bg-primary/10"
                        : "hover:bg-surface-2",
                    )}
                  >
                    {editing ? (
                      <Input
                        autoFocus
                        aria-label={`Rename ${conversation.title}`}
                        value={editingValue}
                        maxLength={80}
                        onChange={(event) => setEditingValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            renameConversation(conversation.id, editingValue);
                            setEditingId(null);
                          } else if (event.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        onBlur={() => {
                          renameConversation(conversation.id, editingValue);
                          setEditingId(null);
                        }}
                        className="h-9"
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            selectConversation(conversation.id);
                            onNavigate?.();
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                        >
                          <MessageSquare
                            aria-hidden="true"
                            size={15}
                            className={cn(
                              "shrink-0",
                              active ? "text-primary" : "text-muted",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-sm",
                                active ? "font-semibold" : "font-medium",
                              )}
                            >
                              {conversation.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[0.625rem] text-muted">
                              <Clock3 aria-hidden="true" size={10} />
                              {shortDate(conversation.updatedAt)} ·{" "}
                              {conversation.messages.length} message
                              {conversation.messages.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Actions for ${conversation.title}`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted opacity-70 transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring group-hover:opacity-100"
                            >
                              <MoreHorizontal aria-hidden="true" size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingId(conversation.id);
                                setEditingValue(conversation.title);
                              }}
                            >
                              <Pencil aria-hidden="true" size={14} /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-danger"
                              onSelect={() => setDeleteId(conversation.id)}
                            >
                              <Trash2 aria-hidden="true" size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">AI provider</span>
            <Badge
              variant={
                providerConfigured === null
                  ? "neutral"
                  : providerConfigured
                    ? "success"
                    : "warning"
              }
            >
              {providerConfigured === null
                ? "Checking"
                : providerConfigured
                  ? "Configured"
                  : "Not configured"}
            </Badge>
          </div>
          <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-muted">
            Conversations and settings are stored on this device only. Server-side
            sync is not implemented yet.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete this conversation?"
        description="Its messages will be removed from this browser permanently."
        confirmLabel="Delete conversation"
        destructive
        onConfirm={() => {
          if (deleteId) deleteConversation(deleteId);
          setDeleteId(null);
        }}
      />
    </>
  );
}
