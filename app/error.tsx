"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getLogger, serializeError } from "@/lib/logging/logger";
import { cn } from "@/lib/utils";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    getLogger("app.error").error("Unhandled render error", {
      error: serializeError(error),
      digest: error.digest,
    });
  }, [error]);

  return (
    <Container className="flex min-h-dvh flex-col items-start justify-center gap-5 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-danger">
        Something went wrong
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        This page could not be rendered.
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted">
        The error was recorded as a structured log entry. You can retry the
        render, or return to the home page.
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
