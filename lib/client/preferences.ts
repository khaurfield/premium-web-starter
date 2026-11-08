import { z } from "zod";

import { readStored, STORAGE_KEYS, writeStored } from "@/lib/client/storage";

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const preferencesSchema = z.object({
  theme: themePreferenceSchema,
  /** Sent as `stream` to /api/chat. */
  streamResponses: z.boolean(),
  /** Enter sends, Shift+Enter inserts a newline. */
  sendWithEnter: z.boolean(),
  /** Real instructions appended to the server system prompt. */
  systemPrompt: z.string().max(4_000),
  /** Null means "use the server default". */
  defaultModel: z.string().max(200).nullable(),
  /** Applies a larger base font size on small screens. */
  fontScale: z.enum(["normal", "large"]),
  showTimestamps: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  streamResponses: true,
  sendWithEnter: true,
  systemPrompt: "",
  defaultModel: null,
  fontScale: "normal",
  showTimestamps: true,
};

export function loadPreferences(): Preferences {
  const parsed = preferencesSchema.safeParse(
    readStored(STORAGE_KEYS.preferences, (raw) => raw),
  );
  if (!parsed.success) return DEFAULT_PREFERENCES;
  return { ...DEFAULT_PREFERENCES, ...parsed.data };
}

export function savePreferences(value: Preferences): boolean {
  return writeStored(STORAGE_KEYS.preferences, value);
}
