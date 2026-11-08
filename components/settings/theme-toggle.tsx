"use client";

import { Moon, Sun } from "lucide-react";

import { useApp } from "@/components/providers/app-provider";
import { IconButton } from "@/components/ui/icon-button";

export function ThemeToggle() {
  const { preferences, resolvedTheme, updatePreferences } = useApp();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <IconButton
      label={`Switch to ${next} theme`}
      tooltip={`Appearance: ${preferences.theme} (currently ${resolvedTheme}). Click to use ${next}.`}
      onClick={() => updatePreferences({ theme: next })}
    >
      {resolvedTheme === "dark" ? (
        <Sun aria-hidden="true" size={18} />
      ) : (
        <Moon aria-hidden="true" size={18} />
      )}
    </IconButton>
  );
}
