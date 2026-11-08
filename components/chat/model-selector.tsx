"use client";

import { Cpu, Eye, RefreshCw } from "lucide-react";

import { useApp } from "@/components/providers/app-provider";
import { IconButton } from "@/components/ui/icon-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const SERVER_DEFAULT = "__server_default__";

export function ModelSelector() {
  const { preferences, updatePreferences, catalog, refreshCatalog } = useApp();
  const models = catalog.status === "ready" ? catalog.data.models : [];
  const defaultModel =
    catalog.status === "ready" ? catalog.data.defaultModel : null;
  const selected =
    preferences.defaultModel && models.some((model) => model.id === preferences.defaultModel)
      ? preferences.defaultModel
      : SERVER_DEFAULT;

  const refreshButton = (
    <IconButton
      label="Refresh model list"
      tooltip="Re-read the server model catalog"
      onClick={refreshCatalog}
    >
      <RefreshCw aria-hidden="true" size={16} />
    </IconButton>
  );

  if (catalog.status === "loading") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted">
          <Spinner /> <span className="hidden sm:inline">Loading models…</span>
        </span>
        {refreshButton}
      </div>
    );
  }

  if (models.length === 0) {
    const reason =
      catalog.status === "error"
        ? `Could not load models: ${catalog.message}. Check the server and retry.`
        : catalog.status === "ready" && !catalog.data.configured
          ? `The server has no AI provider configured. Missing: ${catalog.data.missing.join(", ")}. See the setup guide, then refresh.`
          : "No models are configured on the server.";

    return (
      <div className="flex items-center gap-1.5">
        <span
          title={reason}
          className="inline-flex h-10 max-w-[10.5rem] items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 text-xs font-medium text-warning sm:max-w-none sm:text-sm"
        >
          <Cpu aria-hidden="true" size={15} className="shrink-0" />
          <span className="truncate">
            {catalog.status === "error" ? "Models unavailable" : "No models configured"}
          </span>
        </span>
        {refreshButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={selected}
        onValueChange={(value) =>
          updatePreferences({
            defaultModel: value === SERVER_DEFAULT ? null : value,
          })
        }
      >
        <SelectTrigger
          aria-label="Select model"
          className="max-w-[9.5rem] sm:max-w-[14rem]"
        >
          <Cpu aria-hidden="true" size={15} className="shrink-0 text-primary" />
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value={SERVER_DEFAULT}>
            Server default{defaultModel ? ` · ${defaultModel}` : ""}
          </SelectItem>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <span className="flex items-center gap-1.5">
                {model.label}
                {model.vision ? (
                  <Eye aria-label="Vision capable" size={13} className="text-primary" />
                ) : null}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {refreshButton}
    </div>
  );
}
