import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  requireDatabaseConfig,
  requirePublicDatabaseConfig,
} from "@/lib/db/config";
import type { Database } from "@/lib/db/types";

export type AppSupabaseClient = SupabaseClient<Database>;

const CLIENT_INFO = "premium-web-starter/0.1.0";

const sharedOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: { "X-Client-Info": CLIENT_INFO },
  },
} as const;

/**
 * Server-only admin client. The service-role key bypasses Row Level Security,
 * so this factory must never be imported from a Client Component or shipped in
 * an APK. Every SQL migration enables RLS as the primary safety boundary.
 */
export function createSupabaseAdminClient(): AppSupabaseClient {
  const config = requireDatabaseConfig();
  return createClient<Database>(
    config.url,
    config.serviceRoleKey,
    sharedOptions,
  );
}

/**
 * Server-side client using the public anon key. Useful for RLS-scoped reads
 * once a user session is forwarded; still never exposes the service role key.
 */
export function createSupabaseAnonClient(): AppSupabaseClient {
  const config = requirePublicDatabaseConfig();
  return createClient<Database>(config.url, config.anonKey, sharedOptions);
}
