import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/db/client";
import {
  getDatabaseConfig,
  getPublicDatabaseConfig,
  isDatabaseConfigured,
  requireDatabaseConfig,
  requirePublicDatabaseConfig,
} from "@/lib/db/config";
import { resetServerEnvCache } from "@/lib/env";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

beforeEach(() => {
  resetServerEnvCache();
  for (const key of KEYS) vi.stubEnv(key, "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetServerEnvCache();
});

describe("database configuration", () => {
  it("reports an explicit unconfigured state", () => {
    expect(isDatabaseConfigured()).toBe(false);
    expect(getDatabaseConfig()).toBeNull();
    expect(getPublicDatabaseConfig()).toBeNull();
    expect(() => requireDatabaseConfig()).toThrow(/not configured/);
    expect(() => requirePublicDatabaseConfig()).toThrow(/not configured/);
    expect(() => createSupabaseAdminClient()).toThrow(/not configured/);
    expect(() => createSupabaseAnonClient()).toThrow(/not configured/);
  });

  it("builds real clients once all credentials are present", () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    resetServerEnvCache();

    expect(isDatabaseConfigured()).toBe(true);
    expect(getDatabaseConfig()).toEqual({
      url: "https://project.supabase.co",
      anonKey: "anon-key",
      serviceRoleKey: "service-role-key",
    });

    const admin = createSupabaseAdminClient();
    const anon = createSupabaseAnonClient();
    expect(typeof admin.from).toBe("function");
    expect(typeof anon.from).toBe("function");
  });

  it("allows a partial (anon-only) configuration without the service role", () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon-key");
    resetServerEnvCache();

    expect(getPublicDatabaseConfig()).toEqual({
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    });
    expect(isDatabaseConfigured()).toBe(false);
    expect(typeof createSupabaseAnonClient().from).toBe("function");
    expect(() => createSupabaseAdminClient()).toThrow(/not configured/);
  });
});
