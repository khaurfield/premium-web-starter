"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";

export function CopyButton({
  value,
  label = "Copy to clipboard",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <IconButton
      label={copied ? "Copied" : label}
      tooltip={copied ? "Copied to clipboard" : label}
      onClick={() => void copy()}
      className={className}
    >
      {copied ? (
        <Check aria-hidden="true" size={15} className="text-success" />
      ) : (
        <Copy aria-hidden="true" size={15} />
      )}
    </IconButton>
  );
}
