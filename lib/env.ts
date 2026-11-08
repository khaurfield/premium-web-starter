import "server-only";

import { z } from "zod";

import { AppError } from "@/lib/errors";

export type LogLevelName = "debug" | "info" | "warn" | "error";

const blankToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(
  blankToUndefined,
  z.string().trim().min(1).optional(),
);

const httpUrl = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Must be an http(s) URL without credentials or fragments.");

const optionalUrl = z.preprocess(blankToUndefined, httpUrl.optional());

const boundedInt = (fallback: number, min: number, max: number) =>
  z.preprocess(
    (value) =>
      value === undefined || value === null || value === ""
        ? fallback
        : Number(value),
    z.number().int().min(min).max(max),
  );

/**
 * Validated, server-only environment. Every integration is optional at the
 * foundation stage so the app builds and boots with an empty `.env.local`.
 * Parsing is lazy (request-time), never at module import / build time.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.preprocess(
    blankToUndefined,
    z.enum(["development", "test", "production"]).default("development"),
  ),
  LOG_LEVEL: z.preprocess(
    blankToUndefined,
    z.enum(["debug", "info", "warn", "error"]).default("info"),
  ),

  AI_BASE_URL: optionalUrl,
  AI_API_KEY: optionalText,
  AI_MODEL: optionalText,
  AI_PROVIDER_NAME: z.preprocess(
    blankToUndefined,
    z.string().trim().min(1).default("openai-compatible"),
  ),
  /** Optional comma-separated allow-list of model ids, e.g. `id|Label,id2`. */
  AI_MODELS: optionalText,
  /** Optional comma-separated model ids that accept image parts. */
  AI_VISION_MODELS: optionalText,
  AI_MAX_OUTPUT_TOKENS: boundedInt(1024, 1, 32_000),
  AI_REQUEST_TIMEOUT_MS: boundedInt(30_000, 1_000, 120_000),

  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalText,
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cache: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cache) return cache;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new AppError({
      code: "CONFIGURATION_ERROR",
      message: "Server environment is invalid.",
      expose: false,
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  cache = parsed.data;
  return cache;
}

/** Test-only helper so env changes take effect after the first read. */
export function resetServerEnvCache(): void {
  cache = undefined;
}
