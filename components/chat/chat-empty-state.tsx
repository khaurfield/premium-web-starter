"use client";

import {
  ArrowUpRight,
  FileText,
  ImagePlus,
  Mic,
  Sparkles,
  Zap,
} from "lucide-react";

import { SetupNotice } from "@/components/chat/setup-notice";
import { BrandMark } from "@/components/brand";

const SUGGESTIONS = [
  "Summarise a text file I attach",
  "Explain a code snippet I paste here",
  "Help me draft a short, clear note",
];

const CAPABILITIES = [
  {
    icon: Zap,
    title: "Real streaming",
    body: "Replies arrive as provider deltas, with working stop and retry controls.",
  },
  {
    icon: FileText,
    title: "Files as context",
    body: "Text files are read locally and included in the prompt you send.",
  },
  {
    icon: ImagePlus,
    title: "Image input",
    body: "Images become real provider image parts when your model supports vision.",
  },
  {
    icon: Mic,
    title: "Voice dictation",
    body: "Browser speech recognition fills the composer where it is supported.",
  },
];

export function ChatEmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-4 py-8 text-center sm:py-12">
      <div className="animate-fade-up space-y-4">
        <BrandMark className="mx-auto h-12 w-12 rounded-2xl" />
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <Sparkles aria-hidden="true" size={13} className="text-primary" />
            Your workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What would you like to work on?
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Conversations are stored on this device. Every reply comes from the
            configured AI provider — there are no sample or simulated answers.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm"
          >
            {suggestion}
            <ArrowUpRight aria-hidden="true" size={13} className="text-muted" />
          </button>
        ))}
      </div>

      <SetupNotice />

      <div className="grid w-full gap-3 sm:grid-cols-2">
        {CAPABILITIES.map((capability) => {
          const Icon = capability.icon;
          return (
            <div
              key={capability.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left app-shadow"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden="true" size={17} />
              </span>
              <div>
                <p className="text-sm font-medium">{capability.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {capability.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
