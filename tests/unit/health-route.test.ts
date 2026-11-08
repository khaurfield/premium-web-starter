import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";
import { healthResponseSchema } from "@/lib/api/contracts";
import { resetServerEnvCache } from "@/lib/env";

const KEYS = [
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

beforeEach(() => {
  resetServerEnvCache();
  for (const key of KEYS) vi.stubEnv(key, "");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetServerEnvCache();
});

describe("GET /api/health", () => {
  it("returns a valid envelope with honest unconfigured states", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();

    const payload: unknown = await response.json();
    expect(healthResponseSchema.safeParse(payload).success).toBe(true);
    const parsed = healthResponseSchema.parse(payload);
    expect(parsed.data.integrations.ai).toEqual({
      state: "not_configured",
      configured: false,
    });
    expect(parsed.data.integrations.database.configured).toBe(false);
  });

  it("reports the AI integration as configured when credentials are present", async () => {
    vi.stubEnv("AI_BASE_URL", "https://api.example.com/v1");
    vi.stubEnv("AI_API_KEY", "sk-test-key-123456789");
    vi.stubEnv("AI_MODEL", "example-model");
    resetServerEnvCache();

    const response = await GET(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": "phone-check-1" },
      }),
    );
    expect(response.headers.get("x-request-id")).toBe("phone-check-1");
    const parsed = healthResponseSchema.parse(await response.json());
    expect(parsed.data.integrations.ai.configured).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain("sk-test-key-123456789");
  });

  it("returns a 500 configuration error for an invalid base URL", async () => {
    vi.stubEnv("AI_BASE_URL", "not-a-url");
    resetServerEnvCache();

    const response = await GET(new Request("http://localhost/api/health"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFIGURATION_ERROR" },
    });
  });
});
