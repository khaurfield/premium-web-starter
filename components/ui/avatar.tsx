import { Bot, UserRound } from "lucide-react";

import {
  ACCENT_CLASSES,
  initialsOf,
  type AvatarAccent,
} from "@/lib/client/profile";
import { cn } from "@/lib/utils";

interface AvatarProps {
  role: "user" | "assistant";
  displayName?: string;
  accent?: AvatarAccent;
  className?: string;
}

export function Avatar({
  role,
  displayName = "You",
  accent = "indigo",
  className,
}: AvatarProps) {
  if (role === "assistant") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary",
          className,
        )}
      >
        <Bot size={17} />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.6875rem] font-semibold tracking-wide",
        ACCENT_CLASSES[accent],
        className,
      )}
    >
      {initialsOf(displayName).length > 0 ? (
        initialsOf(displayName)
      ) : (
        <UserRound size={15} />
      )}
    </span>
  );
}
