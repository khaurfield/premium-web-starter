"use client";

import { CircleAlert, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

/**
 * Honest, actionable configuration state. It never pretends a provider exists:
 * the missing variable *names* come from GET /api/models, and no values are
 * ever read or displayed.
 */
export function SetupNotice() {
  const { catalog, refreshCatalog } = useApp();
  if (catalog.status !== "ready" || catalog.data.configured) return null;

  const missing = catalog.data.missing;
  const snippet = [
    "# .env.local (server-side only — never commit this file)",
    'AI_BASE_URL="https://your-provider.example/v1"',
    'AI_API_KEY="your-key"',
    'AI_MODEL="your-model-id"',
    "# optional: AI_MODELS=\"id-a|Fast,id-b|Vision\"",
    "# optional: AI_VISION_MODELS=\"id-b\"",
  ].join("\n");

  return (
    <section
      aria-labelledby="setup-notice-title"
      className="w-full max-w-2xl rounded-card border border-warning/30 bg-warning/5 p-4 text-left sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <CircleAlert aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="setup-notice-title" className="text-sm font-semibold">
            Connect an AI provider to start chatting
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
            The chat interface is fully wired to the real{" "}
            <code className="font-mono">/api/chat</code> endpoint, but the server
            has no provider credentials yet. Messages are not answered with
            sample text — the server reports a typed configuration error until
            these are set.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {missing.length > 0 ? (
              missing.map((name) => (
                <code
                  key={name}
                  className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-[0.6875rem]"
                >
                  {name}
                </code>
              ))
            ) : (
              <span className="text-xs text-muted">
                No missing variables reported; check the server logs.
              </span>
            )}
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <span className="font-mono text-[0.6875rem] text-muted">
                .env.local template
              </span>
              <CopyButton
                value={snippet}
                label="Copy .env.local template"
                className="size-8 rounded-lg"
              />
            </div>
            <pre className="scrollbar-thin overflow-x-auto p-3 font-mono text-[0.6875rem] leading-relaxed text-muted">
              {snippet}
            </pre>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={refreshCatalog}>
              <RefreshCw aria-hidden="true" size={14} /> Recheck configuration
            </Button>
            <Link
              href="/#setup"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline underline-offset-2"
            >
              Setup guide <ExternalLink aria-hidden="true" size={12} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
