"use client";

/* eslint-disable @next/next/no-img-element */
/* Attachment previews are local data URLs from the user's own files. */

import {
  ArrowUp,
  FileText,
  ImagePlus,
  Mic,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import { Alert } from "@/components/ui/alert";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import {
  ALLOWED_IMAGE_MEDIA_TYPES,
  MAX_IMAGES,
  MAX_MESSAGE_CHARS,
  MAX_TEXT_FILES,
  MAX_TOTAL_TEXT_BYTES,
  TEXT_FILE_EXTENSIONS,
  composeMessageContent,
  createImageAttachment,
  createTextAttachment,
} from "@/lib/client/attachments";
import type { Preferences } from "@/lib/client/preferences";
import type { PendingAttachment } from "@/lib/client/types";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { CatalogState } from "@/components/providers/app-provider";
import type { ChatStatus, SendInput } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  onSend: (input: SendInput) => void;
  onStop: () => void;
  status: ChatStatus;
  preferences: Preferences;
  catalog: CatalogState;
}

const TEXT_ACCEPT = `${TEXT_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",")},text/*`;
const IMAGE_ACCEPT = ALLOWED_IMAGE_MEDIA_TYPES.join(",");

export function ChatComposer({
  draft,
  setDraft,
  onSend,
  onStop,
  status,
  preferences,
  catalog,
}: ChatComposerProps) {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);

  const speech = useSpeechRecognition((transcript) => {
    setDraft(draft.trim() ? `${draft.trimEnd()} ${transcript}` : transcript);
  });
  const stopDictation = speech.stop;

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [draft]);

  useEffect(() => () => stopDictation(), [stopDictation]);

  const projectedLength = useMemo(
    () => composeMessageContent(draft, attachments).length,
    [draft, attachments],
  );
  const overLimit = projectedLength > MAX_MESSAGE_CHARS;
  const hasImages = attachments.some((item) => item.kind === "image");
  const isBusy = status !== "idle";

  const visionHint = useMemo(() => {
    if (!hasImages || catalog.status !== "ready") return null;
    const activeId = preferences.defaultModel ?? catalog.data.defaultModel;
    const active = catalog.data.models.find((model) => model.id === activeId);
    if (!active || active.vision) return null;
    return `“${active.label}” is not marked as vision-capable in AI_VISION_MODELS. The provider may reject the image.`;
  }, [hasImages, catalog, preferences.defaultModel]);

  async function addTextFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const existing = attachments.filter((item) => item.kind === "file");
    if (existing.length + files.length > MAX_TEXT_FILES) {
      setLocalError(`You can attach up to ${MAX_TEXT_FILES} text files per message.`);
      return;
    }
    const totalBytes =
      existing.reduce((sum, item) => sum + item.size, 0) +
      files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_TEXT_BYTES) {
      setLocalError("Attached text files exceed the 200 KB total limit.");
      return;
    }

    setBusy(true);
    try {
      const created = await Promise.all(files.map(createTextAttachment));
      setAttachments((current) => [...current, ...created]);
      setLocalError(null);
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Could not read the file.");
    } finally {
      setBusy(false);
    }
  }

  async function addImages(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const existing = attachments.filter((item) => item.kind === "image");
    if (existing.length + files.length > MAX_IMAGES) {
      setLocalError(`You can attach up to ${MAX_IMAGES} images per message.`);
      return;
    }

    setBusy(true);
    try {
      const created = await Promise.all(files.map(createImageAttachment));
      setAttachments((current) => [...current, ...created]);
      setLocalError(null);
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Could not read the image.");
    } finally {
      setBusy(false);
    }
  }

  function submit(): void {
    if (isBusy || busy || overLimit) return;
    if (!draft.trim() && attachments.length === 0) return;
    onSend({ text: draft, attachments });
    setDraft("");
    setAttachments([]);
    setLocalError(null);
    speech.stop();
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      preferences.sendWithEnter &&
      !composingRef.current &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  const sendDisabled =
    isBusy || busy || overLimit || (!draft.trim() && attachments.length === 0);
  const sendReason = overLimit
    ? "Message is too long"
    : !draft.trim() && attachments.length === 0
      ? "Write a message or attach a file first"
      : "Send message";

  return (
    <div className="border-t border-border bg-surface/85 backdrop-blur-md">
      <div className="safe-bottom mx-auto w-full max-w-3xl px-3 pt-3 sm:px-6">
        {(localError || speech.error) ? (
          <Alert variant="danger" className="mb-2.5 py-2.5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span>{localError ?? speech.error}</span>
              <button
                type="button"
                aria-label="Dismiss attachment error"
                onClick={() => {
                  setLocalError(null);
                  speech.clearError();
                }}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-danger/10"
              >
                <X aria-hidden="true" size={13} />
              </button>
            </div>
          </Alert>
        ) : null}

        {visionHint ? (
          <p className="mb-2.5 text-xs leading-relaxed text-warning">{visionHint}</p>
        ) : null}

        {attachments.length > 0 ? (
          <ul className="mb-2.5 flex flex-wrap gap-2" aria-label="Pending attachments">
            {attachments.map((item) => (
              <li
                key={item.id}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-background py-1.5 pl-2 pr-1.5 text-xs"
              >
                {item.kind === "image" ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-8 w-8 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-muted">
                    <FileText aria-hidden="true" size={15} />
                  </span>
                )}
                <span className="max-w-[9rem] truncate font-medium">{item.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((attachment) => attachment.id !== item.id),
                    )
                  }
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X aria-hidden="true" size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="rounded-2xl border border-border bg-background p-2 app-shadow focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
          <Textarea
            ref={textareaRef}
            aria-label="Message the assistant"
            placeholder="Ask anything, attach a file, or dictate with your voice…"
            value={draft}
            rows={1}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
            className="max-h-[12.5rem] min-h-[2.5rem] px-2"
          />

          <div className="flex items-center gap-0.5 border-t border-border/70 pt-1.5">
            <IconButton
              label="Attach text files"
              tooltip={`Attach ${TEXT_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(", ")} files (contents are included in your message)`}
              onClick={() => textInputRef.current?.click()}
              disabled={busy || isBusy}
            >
              <Paperclip aria-hidden="true" size={17} />
            </IconButton>
            <IconButton
              label="Attach images"
              tooltip="Attach PNG, JPEG, WebP or GIF images (sent as real provider image parts)"
              onClick={() => imageInputRef.current?.click()}
              disabled={busy || isBusy}
            >
              <ImagePlus aria-hidden="true" size={17} />
            </IconButton>
            <IconButton
              label={speech.listening ? "Stop dictation" : "Start voice dictation"}
              tooltip={
                speech.supported
                  ? speech.listening
                    ? "Listening — tap to stop"
                    : "Dictate into the message box using your browser's speech recognition"
                  : "Voice dictation is not supported in this browser. Use your keyboard's microphone instead."
              }
              active={speech.listening}
              onClick={speech.toggle}
              disabled={!speech.supported || isBusy}
              className={cn(speech.listening && "text-danger")}
            >
              <Mic aria-hidden="true" size={17} />
            </IconButton>

            <input
              ref={textInputRef}
              type="file"
              multiple
              accept={TEXT_ACCEPT}
              tabIndex={-1}
              className="hidden"
              onChange={(event) => void addTextFiles(event)}
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept={IMAGE_ACCEPT}
              tabIndex={-1}
              className="hidden"
              onChange={(event) => void addImages(event)}
            />

            <span className="ml-auto hidden px-2 text-[0.6875rem] tabular-nums text-muted sm:inline">
              {speech.listening ? (
                <span className="text-danger">Listening…</span>
              ) : projectedLength > 0 ? (
                <span className={cn(overLimit && "text-danger")}>
                  {projectedLength} / {MAX_MESSAGE_CHARS}
                </span>
              ) : (
                preferences.sendWithEnter ? "Enter to send · Shift+Enter for a new line" : "Use the send button"
              )}
            </span>

            {isBusy ? (
              <button
                type="button"
                aria-label="Stop generation"
                onClick={onStop}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger transition-colors hover:bg-danger/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10"
              >
                <Square aria-hidden="true" size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send message"
                title={sendReason}
                onClick={submit}
                disabled={sendDisabled}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10"
              >
                <ArrowUp aria-hidden="true" size={19} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-center text-[0.6875rem] leading-relaxed text-muted">
          Conversations stay in this browser. Text attachments are added to your
          prompt; images go to the provider. No answer is ever simulated.
        </p>
      </div>
    </div>
  );
}
