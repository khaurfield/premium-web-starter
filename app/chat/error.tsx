"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getLogger, serializeError } from "@/lib/logging/logger";
import { cn } from "@/lib/utils";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    getLogger("chat.error").error("Chat workspace failed to render", {
      error: serializeError(error),
      digest: error.digest,
    });
  }, [error]);

  return (
    <Container className="flex min-h-dvh flex-col items-start justify-center gap-5 py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <CircleAlert aria-hidden="true" size={24} />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        The workspace could not load.
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted">
        The error was recorded as a structured log entry. Your locally saved
        conversations are untouched. Retry the render or return to the home page.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={cn(buttonVariants({ variant: "secondary" }))}>
          Back to home
        </Link>
      </div>
    </Container>
  );
}
