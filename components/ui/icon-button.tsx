"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name; also used as the default tooltip. */
  label: string;
  tooltip?: ReactNode;
  active?: boolean;
  variant?: "ghost" | "secondary" | "primary" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

/**
 * One consistent hit target (44px on touch) for every icon-only control.
 * `title` keeps the label available even when a button is disabled.
 */
export function IconButton({
  label,
  tooltip,
  active,
  className,
  variant = "ghost",
  size = "icon",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip content={tooltip ?? label}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={active}
        className={cn(
          buttonVariants({ variant, size }),
          "size-11 shrink-0 rounded-xl sm:size-10",
          active && "bg-surface-2 text-primary",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
