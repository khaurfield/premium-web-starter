"use client";

import {
  Check,
  ChevronDown,
  ExternalLink,
  Moon,
  Settings2,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useApp } from "@/components/providers/app-provider";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ThemePreference } from "@/lib/client/preferences";

interface UserMenuProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Settings2 },
];

export function UserMenu({ onOpenProfile, onOpenSettings }: UserMenuProps) {
  const {
    profile,
    preferences,
    updatePreferences,
    catalog,
    clearAllData,
  } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const providerLabel =
    catalog.status === "ready"
      ? catalog.data.configured
        ? "AI provider: configured"
        : "AI provider: not configured"
      : catalog.status === "error"
        ? "AI provider: status unavailable"
        : "AI provider: checking…";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open profile and settings menu"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-1.5 pr-2.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Avatar
              role="user"
              displayName={profile.displayName}
              accent={profile.accent}
              className="h-8 w-8 rounded-lg"
            />
            <span className="hidden max-w-24 truncate text-sm font-medium sm:inline">
              {profile.displayName}
            </span>
            <ChevronDown aria-hidden="true" size={14} className="hidden text-muted sm:inline" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{providerLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onOpenProfile}>
            <UserRound aria-hidden="true" size={15} /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenSettings}>
            <Settings2 aria-hidden="true" size={15} /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => updatePreferences({ theme: option.value })}
              >
                <Icon aria-hidden="true" size={15} />
                {option.label}
                {preferences.theme === option.value ? (
                  <Check aria-hidden="true" size={14} className="ml-auto text-primary" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/">
              <ExternalLink aria-hidden="true" size={15} /> Back to website
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-danger"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" size={15} /> Clear local data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear all local data?"
        description="This permanently removes your conversations, profile and settings from this browser."
        confirmLabel="Clear everything"
        destructive
        onConfirm={clearAllData}
      />
    </>
  );
}
