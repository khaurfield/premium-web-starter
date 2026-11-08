"use client";

import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { healthResponseSchema } from "@/lib/api/contracts";

type HealthData = ReturnType<typeof extractHealthData>;

function extractHealthData(payload: unknown) {
  const parsed = healthResponseSchema.parse(payload);
  return parsed.data;
}

type StatusState =
  | { kind: "loading" }
  | { kind: "ready"; data: HealthData }
  | { kind: "error"; message: string };

export function SystemStatus() {
  const [state, setState] = useState<StatusState>({ kind: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/health", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Health endpoint returned HTTP ${response.status}`);
        }
        const payload: unknown = await response.json();
        const data = extractHealthData(payload);
        if (active) setState({ kind: "ready", data });
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setState({
          kind: "error",
          message:
            cause instanceof Error ? cause.message : "Unknown health-check error",
        });
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshKey]);

  return (
    <Card id="status" className="scroll-mt-24">
      <CardHeader className="sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <CardTitle>Live system status</CardTitle>
          <CardDescription>
            Read from <code>/api/health</code>. Optional integrations report
            their real configuration state.
          </CardDescription>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setState({ kind: "loading" });
            setRefreshKey((key) => key + 1);
          }}
        >
          <RefreshCw aria-hidden="true" size={14} /> Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.kind === "loading" ? (
          <Alert variant="info" title="Checking runtime…">
            Fetching the health endpoint. This does not call any AI provider.
          </Alert>
        ) : null}

        {state.kind === "error" ? (
          <Alert variant="danger" title="Health check unavailable">
            {state.message}. Check the Vercel/Action logs for the structured
            error entry.
          </Alert>
        ) : null}

        {state.kind === "ready" ? (
          <>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              <IntegrationRow
                label="AI provider"
                configured={state.data.integrations.ai.configured}
                detail="Real OpenAI-compatible chat endpoint"
              />
              <IntegrationRow
                label="Database"
                configured={state.data.integrations.database.configured}
                detail="Supabase schema + typed client"
              />
            </dl>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span>version {state.data.version}</span>
              <span>
                checked {new Date(state.data.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-mono">request {state.data.requestId.slice(0, 8)}</span>
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IntegrationRow({
  label,
  configured,
  detail,
}: {
  label: string;
  configured: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 bg-surface p-4">
      <div>
        <dt className="text-sm font-medium">{label}</dt>
        <dd className="mt-1 text-xs text-muted">{detail}</dd>
      </div>
      <Badge variant={configured ? "success" : "warning"}>
        {configured ? (
          <CheckCircle2 aria-hidden="true" size={12} />
        ) : (
          <CircleAlert aria-hidden="true" size={12} />
        )}
        {configured ? "Configured" : "Not configured"}
      </Badge>
    </div>
  );
}
