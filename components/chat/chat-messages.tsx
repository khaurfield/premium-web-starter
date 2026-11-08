"use client";

import { CircleAlert, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatMessageItem } from "@/components/chat/chat-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/client/conversations";
import type { ApiErrorInfo } from "@/lib/client/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  error: ApiErrorInfo | null;
  storageError: string | null;
  onRetry: () => void;
  onClearError: () => void;
  onSuggestion: (text: string) => void;
}

export function ChatMessages({
  messages,
  error,
  storageError,
  onRetry,
  onClearError,
  onSuggestion,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !pinnedRef.current) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, error]);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const element = event.currentTarget;
        pinnedRef.current =
          element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      }}
      className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-6 sm:py-7">
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestion={onSuggestion} />
        ) : (
          <div className="space-y-6" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </div>
        )}

        {storageError ? (
          <Alert variant="warning" title="Local storage unavailable" className="mt-5">
            {storageError}
          </Alert>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-5 animate-fade-up rounded-card border border-danger/30 bg-danger/5 p-4"
          >
            <div className="flex items-start gap-3">
              <CircleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Request failed
                  <span className="ml-2 font-mono text-xs font-normal text-danger">
                    {error.code}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                  {error.message}
                </p>
                {error.code === "AI_NOT_CONFIGURED" ? (
                  <p className="mt-2 text-xs text-muted">
                    Add server credentials, then recheck. See the{" "}
                    <Link href="/#setup" className="text-primary underline">
                      setup guide
                    </Link>
                    . No sample answer was generated.
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={onRetry}>
                    <RefreshCw aria-hidden="true" size={14} /> Retry
                  </Button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss error"
                onClick={onClearError}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" size={15} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
