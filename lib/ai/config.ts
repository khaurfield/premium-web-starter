import "server-only";

import { getServerEnv, type ServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  providerName: string;
  maxOutputTokens: number;
  timeoutMs: number;
}

/** Returns `null` when the integration is deliberately left unconfigured. */
export function getAIConfig(env: ServerEnv = getServerEnv()): AIConfig | null {
  if (!env.AI_BASE_URL || !env.AI_API_KEY || !env.AI_MODEL) return null;
  return {
    baseURL: env.AI_BASE_URL,
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL,
    providerName: env.AI_PROVIDER_NAME,
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
  };
}

export function isAIConfigured(): boolean {
  return getAIConfig() !== null;
}

/** Throws a client-safe 503 instead of ever producing a fabricated answer. */
export function requireAIConfig(): AIConfig {
  const config = getAIConfig();
  if (!config) {
    throw new AppError({
      code: "AI_NOT_CONFIGURED",
      message:
        "The AI provider is not configured. Set AI_BASE_URL, AI_API_KEY and AI_MODEL in the server environment (see .env.example).",
      expose: true,
    });
  }
  return config;
}
