import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAIConfig, isAIConfigured, requireAIConfig } from "@/lib/ai/config";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getServerEnv, resetServerEnvCache, serverEnvSchema } from "@/lib/env";
import { AppError } from "@/lib/errors";

const AI_KEYS = [
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_PROVIDER_NAME",
  "AI_MAX_OUTPUT_TOKENS",
  "AI_REQUEST_TIMEOUT_MS",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LOG_LEVEL",
] as const;

beforeEach(() => {
  resetServerEnvCache();
  for (const key of AI_KEYS) vi.stubEnv(key, "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetServerEnvCache();
});

describe("serverEnvSchema", () => {
  it("treats blank optional values as absent and applies safe defaults", () => {
    const env = getServerEnv();
    expect(env.NODE_ENV).toBe("test");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.AI_MAX_OUTPUT_TOKENS).toBe(1024);
    expect(env.AI_REQUEST_TIMEOUT_MS).toBe(30_000);
    expect(env.AI_PROVIDER_NAME).toBe("openai-compatible");
    expect(env.AI_BASE_URL).toBeUndefined();
    expect(isAIConfigured()).toBe(false);
    expect(isDatabaseConfigured()).toBe(false);
  });

  it("rejects a non-URL AI_BASE_URL instead of silently accepting it", () => {
    vi.stubEnv("AI_BASE_URL", "not-a-url");
    resetServerEnvCache();
    expect(() => getServerEnv()).toThrow(AppError);
    expect(() => getServerEnv()).toThrow(/Server environment is invalid/);
  });

  it("rejects out-of-range numeric limits", () => {
    vi.stubEnv("AI_MAX_OUTPUT_TOKENS", "999999");
    resetServerEnvCache();
    expect(() => getServerEnv()).toThrow(AppError);
  });

  it("parses a fully configured environment", () => {
    vi.stubEnv("AI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_API_KEY", "sk-test-key-123456789");
    vi.stubEnv("AI_MODEL", "example-model");
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    resetServerEnvCache();

    const config = getAIConfig();
    expect(config).toMatchObject({
      baseURL: "https://api.example.com/v1",
      model: "example-model",
      providerName: "openai-compatible",
    });
    expect(isAIConfigured()).toBe(true);
    expect(isDatabaseConfigured()).toBe(true);
    expect(requireAIConfig()).toEqual(config);
  });

  it("does not include the API key in the schema's inferred shape as a public value", () => {
    const parsed = serverEnvSchema.safeParse({ AI_API_KEY: "sk-test-key-123456789" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.AI_API_KEY).toBe("sk-test-key-123456789");
    expect(Object.keys(parsed.data)).not.toContain("NEXT_PUBLIC_AI_API_KEY");
  });
});
