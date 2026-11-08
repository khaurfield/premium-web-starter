"use client";

import { useCallback, useRef, useState } from "react";

import { generatedChatSchema } from "@/lib/api/contracts";
import { ApiRequestError, toErrorInfo } from "@/lib/client/api";
import {
  composeMessageContent,
  MAX_MESSAGE_CHARS,
  toImageInputs,
  toMessageAttachments,
} from "@/lib/client/attachments";
import type { ChatMessage } from "@/lib/client/conversations";
import { createId } from "@/lib/client/storage";
import type { Preferences } from "@/lib/client/preferences";
import type { ApiErrorInfo, PendingAttachment } from "@/lib/client/types";

export type ChatStatus = "idle" | "submitting" | "streaming";

export interface SendInput {
  text: string;
  attachments: PendingAttachment[];
}

interface UseChatOptions {
  conversationId: string | null;
  messages: ChatMessage[];
  updateMessages: (
    id: string,
    updater: (messages: ChatMessage[]) => ChatMessage[],
  ) => void;
  preferences: Preferences;
  model?: string;
}

interface LastRequest {
  input: SendInput;
  body: Record<string, unknown>;
}

interface ChatController {
  status: ChatStatus;
  error: ApiErrorInfo | null;
  send: (input: SendInput) => void;
  stop: () => void;
  retry: () => void;
  clearError: () => void;
}

const MAX_HISTORY_CHARS = 24_000;

function buildHistory(
  messages: ChatMessage[],
): { role: "user" | "assistant"; content: string }[] {
  const history = messages
    .filter(
      (message) =>
        (message.status === "complete" || message.status === "stopped") &&
        message.content.trim().length > 0,
    )
    .map((message) => ({ role: message.role, content: message.content }))
    .slice(-49);

  // Keep the most recent turns within a safe prompt budget.
  let total = history.reduce((sum, item) => sum + item.content.length, 0);
  while (history.length > 1 && total > MAX_HISTORY_CHARS) {
    const removed = history.shift();
    total -= removed?.content.length ?? 0;
  }
  return history;
}

/**
 * Talks only to the real /api/chat endpoint. Assistant text is ever written
 * from provider deltas (or the JSON completion) — nothing is fabricated here.
 */
export function useChat({
  conversationId,
  messages,
  updateMessages,
  preferences,
  model,
}: UseChatOptions): ChatController {
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const statusRef = useRef<ChatStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const lastRequestRef = useRef<LastRequest | null>(null);

  const changeStatus = useCallback((next: ChatStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const run = useCallback(
    async (input: SendInput, isRetry: boolean): Promise<void> => {
      if (!conversationId || statusRef.current !== "idle") return;

      const content = composeMessageContent(input.text, input.attachments);
      const imageCount = input.attachments.filter(
        (attachment) => attachment.kind === "image",
      ).length;
      if (!content.trim() && imageCount === 0) {
        setError({
          code: "EMPTY_MESSAGE",
          message: "Write a message or attach a text file or image first.",
        });
        return;
      }
      if (content.length > MAX_MESSAGE_CHARS) {
        setError({
          code: "MESSAGE_TOO_LONG",
          message: `The message is ${content.length} characters; the limit is ${MAX_MESSAGE_CHARS}.`,
        });
        return;
      }

      const images = toImageInputs(input.attachments);
      const history = buildHistory(messages);
      // A retry already has this turn in the stored history; resend it once.
      const lastHistory = history[history.length - 1];
      if (
        isRetry &&
        lastHistory?.role === "user" &&
        lastHistory.content === content
      ) {
        history.pop();
      }
      const body: Record<string, unknown> = {
        messages: [...history, { role: "user", content }],
        stream: preferences.streamResponses,
        ...(model ? { model } : {}),
        ...(preferences.systemPrompt.trim()
          ? { systemPrompt: preferences.systemPrompt.trim() }
          : {}),
        ...(images.length > 0 ? { images } : {}),
      };

      const displayText =
        input.text.trim() ||
        (input.attachments.length > 0 ? "(attachment)" : "");
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content,
        ...(displayText !== content ? { displayText } : {}),
        createdAt: new Date().toISOString(),
        status: "complete",
        ...(toMessageAttachments(input.attachments).length > 0
          ? { attachments: toMessageAttachments(input.attachments) }
          : {}),
        ...(model ? { model } : {}),
      };
      const assistantId = createId();
      const previousAssistantId = assistantIdRef.current;
      assistantIdRef.current = assistantId;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "streaming",
        ...(model ? { model } : {}),
      };

      lastRequestRef.current = { input, body };
      setError(null);
      changeStatus("submitting");

      updateMessages(conversationId, (current) => {
        const base =
          isRetry && previousAssistantId
            ? current.filter((message) => message.id !== previousAssistantId)
            : current;
        return [
          ...base,
          ...(isRetry ? [] : [userMessage]),
          assistantMessage,
        ];
      });

      const controller = new AbortController();
      abortRef.current = controller;
      let accumulated = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          let code = `HTTP_${response.status}`;
          let message = `The server returned HTTP ${response.status}.`;
          let requestId: string | undefined;
          try {
            const payload: unknown = await response.json();
            const envelope = payload as {
              error?: { code?: string; message?: string };
              requestId?: string;
            };
            code = envelope.error?.code ?? code;
            message = envelope.error?.message ?? message;
            requestId = envelope.requestId;
          } catch {
            // Non-JSON failures still map to a typed error.
          }
          throw new ApiRequestError({
            code,
            message,
            status: response.status,
            requestId:
              response.headers.get("x-request-id") ?? requestId ?? undefined,
          });
        }

        if (preferences.streamResponses) {
          if (!response.body) {
            throw new ApiRequestError({
              code: "EMPTY_STREAM",
              message: "The server returned no response body.",
              status: response.status,
            });
          }
          changeStatus("streaming");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            const snapshot = accumulated;
            updateMessages(conversationId, (current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: snapshot, status: "streaming" }
                  : message,
              ),
            );
          }
          accumulated += decoder.decode();
        } else {
          const payload: unknown = await response.json();
          const envelope = payload as { data?: unknown };
          const parsed = generatedChatSchema.safeParse(envelope.data);
          if (!parsed.success) {
            throw new ApiRequestError({
              code: "INVALID_RESPONSE",
              message: "The completion response was malformed.",
              status: response.status,
            });
          }
          accumulated = parsed.data.text;
        }

        const finalText = accumulated;
        updateMessages(conversationId, (current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: finalText,
                  status: finalText.trim() ? "complete" : "error",
                  ...(finalText.trim()
                    ? {}
                    : {
                        error: {
                          code: "EMPTY_COMPLETION",
                          message: "The provider returned an empty completion.",
                        },
                      }),
                }
              : message,
          ),
        );
        if (!finalText.trim()) {
          setError({
            code: "EMPTY_COMPLETION",
            message: "The provider returned an empty completion. Try again.",
          });
        }
      } catch (cause) {
        if (controller.signal.aborted) {
          const partial = accumulated;
          updateMessages(conversationId, (current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: partial, status: "stopped" }
                : message,
            ),
          );
        } else {
          const info = toErrorInfo(cause);
          updateMessages(conversationId, (current) =>
            current
              .filter(
                (message) =>
                  message.id !== assistantId || message.content.trim().length > 0,
              )
              .map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      status: "error" as const,
                      error: { code: info.code, message: info.message },
                    }
                  : message,
              ),
          );
          setError(info);
        }
      } finally {
        abortRef.current = null;
        changeStatus("idle");
      }
    },
    [changeStatus, conversationId, messages, model, preferences, updateMessages],
  );

  const send = useCallback(
    (input: SendInput) => {
      void run(input, false);
    },
    [run],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retry = useCallback(() => {
    const last = lastRequestRef.current;
    if (!last || statusRef.current !== "idle") return;
    void run(last.input, true);
  }, [run]);

  const clearError = useCallback(() => setError(null), []);

  return { status, error, send, stop, retry, clearError };
}
