"use client";

import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-xl border border-transparent bg-transparent px-1 py-2 text-[0.9375rem] leading-6 text-foreground placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
