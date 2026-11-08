"use client";

/* eslint-disable @next/next/no-img-element */
/* User-supplied data URLs cannot be optimised by next/image; previews are
   rendered from local blobs only and are never persisted. */

import { CircleAlert, FileText, ImagePlus } from "lucide-react";

import { useApp } from "@/components/providers/app-provider";
import { Avatar } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { Markdown } from "@/components/ui/markdown";
import type { ChatMessage } from "@/lib/client/conversations";
import { cn } from "@/lib/utils";

function timeOf(iso: string): string {
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(iso);
  return match?.[1] ?? "";
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" role="status" aria-label="Waiting for the provider">
      <span className="h-1.5 w-1.5 rounded-full bg-muted animate-dot" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted animate-dot [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted animate-dot [animation-delay:0.3s]" />
    </span>
  );
}

function AttachmentChips({ message }: { message: ChatMessage }) {
  if (!message.attachments?.length) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {message.attachments.map((attachment) => (
        <span
          key={attachment.id}
          title={
            attachment.kind === "image" && !attachment.previewUrl
              ? "Image bytes are not kept in local history."
              : attachment.name
          }
          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs"
        >
          {attachment.kind === "image" && attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface text-muted">
              {attachment.kind === "image" ? (
                <ImagePlus aria-hidden="true" size={14} />
              ) : (
                <FileText aria-hidden="true" size={14} />
              )}
            </span>
          )}
          <span className="max-w-[9rem] truncate">{attachment.name}</span>
          {attachment.kind === "image" && !attachment.previewUrl ? (
            <span className="text-[0.625rem] text-muted">not saved</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const { profile, preferences } = useApp();
  const isUser = message.role === "user";
  const text = isUser ? (message.displayText ?? message.content) : message.content;
  const isWaiting = message.status === "streaming" && !message.content;

  return (
    <article
      className={cn(
        "animate-fade-up flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      aria-label={isUser ? "Your message" : "Assistant message"}
    >
      <Avatar
        role={message.role}
        displayName={profile.displayName}
        accent={profile.accent}
      />

      <div className={cn("flex min-w-0 max-w-[88%] flex-col gap-1 sm:max-w-[78%]", isUser && "items-end")}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6875rem] text-muted",
            isUser && "flex-row-reverse",
          )}
        >
          <span className="font-semibold text-foreground">
            {isUser ? profile.displayName : "Assistant"}
          </span>
          {!isUser && message.model ? (
            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.625rem]">
              {message.model}
            </span>
          ) : null}
          {preferences.showTimestamps && timeOf(message.createdAt) ? (
            <time dateTime={message.createdAt}>{timeOf(message.createdAt)} UTC</time>
          ) : null}
          {message.status === "stopped" ? (
            <span className="rounded bg-warning/10 px-1.5 py-0.5 text-warning">
              stopped
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "min-w-0 rounded-2xl px-4 py-3 text-left",
            isUser
              ? "border border-primary/20 bg-primary/10 text-foreground"
              : "border border-border bg-surface text-foreground app-shadow",
          )}
        >
          {isWaiting ? (
            <TypingDots />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed">
              {text}
            </p>
          ) : (
            <>
              <Markdown content={message.content} />
              {message.status === "streaming" ? (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-text-bottom"
                />
              ) : null}
            </>
          )}

          {message.status === "error" && message.error ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
              <CircleAlert aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-mono">{message.error.code}</span> ·{" "}
                {message.error.message}
              </span>
            </div>
          ) : null}

          <AttachmentChips message={message} />
        </div>

        {!isUser && message.content ? (
          <div className="mt-0.5 flex items-center gap-1">
            <CopyButton
              value={message.content}
              label="Copy assistant message"
              className="size-8 rounded-lg"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
