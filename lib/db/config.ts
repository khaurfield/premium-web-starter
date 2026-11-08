import "server-only";

import { getServerEnv, type ServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";

export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface PublicDatabaseConfig {
  url: string;
  anonKey: string;
}

export function getDatabaseConfig(
  env: ServerEnv = getServerEnv(),
): DatabaseConfig | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getPublicDatabaseConfig(
  env: ServerEnv = getServerEnv(),
): PublicDatabaseConfig | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  return { url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY };
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseConfig() !== null;
}

export function requireDatabaseConfig(): DatabaseConfig {
  const config = getDatabaseConfig();
  if (!config) {
    throw new AppError({
      code: "DATABASE_NOT_CONFIGURED",
      message:
        "The database is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in the server environment.",
      expose: true,
    });
  }
  return config;
}

export function requirePublicDatabaseConfig(): PublicDatabaseConfig {
  const config = getPublicDatabaseConfig();
  if (!config) {
    throw new AppError({
      code: "DATABASE_NOT_CONFIGURED",
      message:
        "The database is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in the server environment.",
      expose: true,
    });
  }
  return config;
}
