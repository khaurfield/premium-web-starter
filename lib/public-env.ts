import { APP_NAME_FALLBACK } from "@/lib/app-info";

/**
 * Browser-safe configuration. Only `NEXT_PUBLIC_*` values belong here; Next.js
 * inlines them at build time. Never add a server secret to this module.
 */
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const publicEnv = {
  appName: clean(process.env.NEXT_PUBLIC_APP_NAME) ?? APP_NAME_FALLBACK,
  appUrl: clean(process.env.NEXT_PUBLIC_APP_URL) ?? "",
} as const;
