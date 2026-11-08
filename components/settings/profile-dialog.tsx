"use client";

import { Check } from "lucide-react";

import { useApp } from "@/components/providers/app-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AvatarAccent } from "@/lib/client/profile";
import { cn } from "@/lib/utils";

const ACCENTS: AvatarAccent[] = [
  "indigo",
  "violet",
  "teal",
  "amber",
  "rose",
];

const ACCENT_SWATCHES: Record<AvatarAccent, string> = {
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { profile, updateProfile } = useApp();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your profile</DialogTitle>
          <DialogDescription>
            This is a local display profile. Accounts, sign-in and sync are not
            implemented in this stage.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
          <Avatar
            role="user"
            displayName={profile.displayName || "You"}
            accent={profile.accent}
            className="h-12 w-12 rounded-2xl text-base"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {profile.displayName || "You"}
            </p>
            <p className="text-xs text-muted">Saved on this device only</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label htmlFor="display-name" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="display-name"
            value={profile.displayName}
            maxLength={60}
            onChange={(event) =>
              updateProfile({ displayName: event.target.value })
            }
            placeholder="Your name"
          />
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Avatar colour</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                aria-label={`Use ${accent} avatar colour`}
                aria-pressed={profile.accent === accent}
                onClick={() => updateProfile({ accent })}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  ACCENT_SWATCHES[accent],
                  profile.accent === accent && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                )}
              >
                {profile.accent === accent ? (
                  <Check aria-hidden="true" size={18} className="text-white" />
                ) : null}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
