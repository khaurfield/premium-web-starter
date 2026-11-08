import { z } from "zod";

import { readStored, STORAGE_KEYS, writeStored } from "@/lib/client/storage";

export const avatarAccentSchema = z.enum([
  "indigo",
  "violet",
  "teal",
  "amber",
  "rose",
]);
export type AvatarAccent = z.infer<typeof avatarAccentSchema>;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  accent: avatarAccentSchema,
});

export type Profile = z.infer<typeof profileSchema>;

export const DEFAULT_PROFILE: Profile = {
  displayName: "You",
  accent: "indigo",
};

export const ACCENT_CLASSES: Record<AvatarAccent, string> = {
  indigo: "bg-indigo-500 text-white",
  violet: "bg-violet-500 text-white",
  teal: "bg-teal-600 text-white",
  amber: "bg-amber-500 text-slate-950",
  rose: "bg-rose-500 text-white",
};

export function loadProfile(): Profile {
  const parsed = profileSchema.safeParse(readStored(STORAGE_KEYS.profile, (raw) => raw));
  if (!parsed.success) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...parsed.data };
}

export function saveProfile(value: Profile): boolean {
  return writeStored(STORAGE_KEYS.profile, value);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Y";
  if (parts.length === 1) return (parts[0] ?? "Y").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}
