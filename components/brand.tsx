import Link from "next/link";

import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a5 5 0 0 1 5 5v1a4 4 0 0 1 0 8v1a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-1a4 4 0 0 1 0-8V8a5 5 0 0 1 5-5Z" />
        <path d="M9 11h.01M15 11h.01M9.5 15.5c1.6 1 3.4 1 5 0" />
        <path d="M12 3v-1M4 9H3M21 9h-1" />
      </svg>
    </span>
  );
}

export function Brand({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <BrandMark />
      {!compact ? (
        <span className="truncate text-sm font-semibold tracking-tight sm:text-[0.9375rem]">
          {publicEnv.appName}
        </span>
      ) : null}
    </Link>
  );
}
