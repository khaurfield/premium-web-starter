"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { useApp } from "@/components/providers/app-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ThemePreference } from "@/lib/client/preferences";

const SERVER_DEFAULT = "__server_default__";
const MAX_PROMPT_LENGTH = 4_000;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SettingRow({
  label,
  description,
  htmlFor,
  control,
}: {
  label: string;
  description: string;
  htmlFor?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium">
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    preferences,
    updatePreferences,
    catalog,
    clearAllData,
  } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const models = catalog.status === "ready" ? catalog.data.models : [];
  const selectedModel =
    preferences.defaultModel && models.some((m) => m.id === preferences.defaultModel)
      ? preferences.defaultModel
      : SERVER_DEFAULT;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88dvh] max-w-xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Preferences are saved on this device and applied immediately.
              Server credentials are configured in your hosting environment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section aria-labelledby="settings-appearance">
              <h3
                id="settings-appearance"
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Appearance
              </h3>
              <div className="mt-1 divide-y divide-border">
                <SettingRow
                  label="Theme"
                  description="Light, dark, or match your device setting."
                  htmlFor="theme-select"
                  control={
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) =>
                        updatePreferences({ theme: value as ThemePreference })
                      }
                    >
                      <SelectTrigger id="theme-select" className="w-[9.5rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingRow
                  label="Text size"
                  description="Larger text is easier to read on small screens."
                  htmlFor="font-select"
                  control={
                    <Select
                      value={preferences.fontScale}
                      onValueChange={(value) =>
                        updatePreferences({
                          fontScale: value === "large" ? "large" : "normal",
                        })
                      }
                    >
                      <SelectTrigger id="font-select" className="w-[9.5rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
              </div>
            </section>

            <section aria-labelledby="settings-chat">
              <h3
                id="settings-chat"
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Chat behaviour
              </h3>
              <div className="mt-1 divide-y divide-border">
                <SettingRow
                  label="Stream responses"
                  description="Show provider text as it arrives. Turn off for a single response."
                  htmlFor="stream-switch"
                  control={
                    <Switch
                      id="stream-switch"
                      checked={preferences.streamResponses}
                      onCheckedChange={(checked) =>
                        updatePreferences({ streamResponses: checked })
                      }
                    />
                  }
                />
                <SettingRow
                  label="Enter to send"
                  description="When off, only the send button submits. Shift+Enter always adds a line."
                  htmlFor="enter-switch"
                  control={
                    <Switch
                      id="enter-switch"
                      checked={preferences.sendWithEnter}
                      onCheckedChange={(checked) =>
                        updatePreferences({ sendWithEnter: checked })
                      }
                    />
                  }
                />
                <SettingRow
                  label="Show timestamps"
                  description="Display the time each message was created."
                  htmlFor="timestamps-switch"
                  control={
                    <Switch
                      id="timestamps-switch"
                      checked={preferences.showTimestamps}
                      onCheckedChange={(checked) =>
                        updatePreferences({ showTimestamps: checked })
                      }
                    />
                  }
                />
                <SettingRow
                  label="Default model"
                  description="Only models configured on the server are offered."
                  htmlFor="model-select"
                  control={
                    <Select
                      value={selectedModel}
                      disabled={models.length === 0}
                      onValueChange={(value) =>
                        updatePreferences({
                          defaultModel: value === SERVER_DEFAULT ? null : value,
                        })
                      }
                    >
                      <SelectTrigger id="model-select" className="w-[11rem]">
                        <SelectValue placeholder="Server default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SERVER_DEFAULT}>
                          Server default
                        </SelectItem>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.label}
                            {model.vision ? " · vision" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
              </div>
              {models.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  No models are configured on the server yet. See the{" "}
                  <Link href="/#setup" className="text-primary underline">
                    setup guide
                  </Link>
                  .
                </p>
              ) : null}
            </section>

            <section aria-labelledby="settings-instructions">
              <h3
                id="settings-instructions"
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Custom instructions
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Added to every request as real system instructions. Never put
                secrets here.
              </p>
              <Textarea
                id="system-prompt"
                aria-label="Custom instructions"
                rows={4}
                maxLength={MAX_PROMPT_LENGTH}
                value={preferences.systemPrompt}
                onChange={(event) =>
                  updatePreferences({ systemPrompt: event.target.value })
                }
                placeholder="e.g. Keep answers short and use bullet points."
                className="mt-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-visible:border-primary"
              />
              <p className="mt-1 text-right text-xs text-muted">
                {preferences.systemPrompt.length} / {MAX_PROMPT_LENGTH}
              </p>
            </section>

            <section aria-labelledby="settings-data">
              <h3
                id="settings-data"
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Local data
              </h3>
              <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Conversations on this device</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    History, profile and settings live in browser storage. Clearing
                    removes them permanently; nothing is synced yet.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 aria-hidden="true" size={15} /> Clear data
                </Button>
              </div>
              <Link
                href="/#setup"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
              >
                Server &amp; deployment setup <ExternalLink aria-hidden="true" size={12} />
              </Link>
            </section>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear all local data?"
        description="This permanently removes your conversations, profile and settings from this browser. It cannot be undone."
        confirmLabel="Clear everything"
        destructive
        onConfirm={clearAllData}
      />
    </>
  );
}
