/**
 * Small, defensive localStorage helpers. Everything the assistant stores stays
 * on this device; no server-side conversation persistence exists yet.
 */

export const STORAGE_KEYS = {
  preferences: "pai.preferences.v1",
  profile: "pai.profile.v1",
  conversations: "pai.conversations.v1",
} as const;

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStored<T>(
  key: string,
  parse: (raw: unknown) => T | null,
): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return parse(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Returns false when storage is unavailable or full (private mode / quota). */
export function writeStored(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearStored(...keys: string[]): void {
  if (!isBrowser()) return;
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore: the UI reports persistence failures separately.
    }
  }
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
