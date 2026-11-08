"use client";

import { useEffect } from "react";

import { getLogger, serializeError } from "@/lib/logging/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    getLogger("app.global-error").error("Root layout failed", {
      error: serializeError(error),
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          lineHeight: 1.6,
        }}
      >
        <h1>Application error</h1>
        <p>The root layout failed. The error has been logged.</p>
        <button onClick={reset} style={{ padding: "0.6rem 1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
