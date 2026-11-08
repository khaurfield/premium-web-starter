import "server-only";

import type { ModelCatalog, ModelInfo } from "@/lib/api/contracts";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";

const MAX_MODELS = 12;

/** Split a comma/newline separated env value into clean, unique tokens. */
function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const values: string[] = [];
  for (const token of raw.split(/[\n,]/)) {
    const clean = token.trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    values.push(clean);
  }
  return values;
}

/** Accept `model-id` or `model-id|Human readable label`. */
function parseModelList(raw: string | undefined): { id: string; label: string }[] {
  return parseList(raw)
    .map((entry) => {
      const [id, ...labelParts] = entry.split("|");
      const cleanId = id?.trim() ?? "";
      const label = labelParts.join("|").trim();
      return cleanId ? { id: cleanId, label: label || cleanId } : null;
    })
    .filter((entry): entry is { id: string; label: string } => entry !== null);
}

/**
 * The browser-visible model catalog. It is derived entirely from server-side
 * configuration, so the UI can only offer models the backend will really use.
 */
export function getModelCatalog(env: ServerEnv = getServerEnv()): ModelCatalog {
  const configured = Boolean(env.AI_BASE_URL && env.AI_API_KEY && env.AI_MODEL);

  const missing: string[] = [];
  if (!env.AI_BASE_URL) missing.push("AI_BASE_URL");
  if (!env.AI_API_KEY) missing.push("AI_API_KEY");
  if (!env.AI_MODEL) missing.push("AI_MODEL");

  const visionIds = new Set(parseList(env.AI_VISION_MODELS));
  const declared = parseModelList(env.AI_MODELS);

  const entries = declared.length > 0 ? [...declared] : [];
  if (env.AI_MODEL && !entries.some((entry) => entry.id === env.AI_MODEL)) {
    entries.unshift({ id: env.AI_MODEL, label: env.AI_MODEL });
  }

  const models: ModelInfo[] = entries.slice(0, MAX_MODELS).map((entry) => ({
    id: entry.id,
    label: entry.label,
    vision: visionIds.has(entry.id),
  }));

  return {
    configured,
    providerName: configured ? env.AI_PROVIDER_NAME : null,
    defaultModel: configured ? env.AI_MODEL ?? null : null,
    models,
    missing,
  };
}

/**
 * Reject unknown model ids at the boundary. When the integration is not
 * configured the provider reports the real 503 instead of hiding it.
 */
export function resolveModel(
  requested: string | undefined,
  env: ServerEnv = getServerEnv(),
): string | undefined {
  if (!requested) return undefined;

  const catalog = getModelCatalog(env);
  if (!catalog.configured) return requested;
  if (!catalog.models.some((model) => model.id === requested)) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Unknown model. Choose an id returned by GET /api/models.",
      expose: true,
    });
  }
  return requested;
}
