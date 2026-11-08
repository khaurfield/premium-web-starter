# Database (prepared, not yet applied)

The foundation ships a **schema definition** and **typed client factories**, but
it does not create any tables. Nothing in `npm run build` or `npm run dev` talks
to a database. You decide when to apply the migration.

## What is included

| File | Purpose |
|---|---|
| `migrations/0001_init.sql` | `profiles`, `conversations`, `messages`, `documents`, `document_chunks` (+ `pgvector`), indexes, `updated_at` triggers and Row Level Security policies |
| `../lib/db/config.ts` | Validates `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; returns `null`/a typed 503 when unconfigured |
| `../lib/db/client.ts` | `createSupabaseAdminClient()` and `createSupabaseAnonClient()` factories (`server-only`) |
| `../lib/db/types.ts` | Hand-written TypeScript schema types matching the migration |

## Applying it (free Supabase project, no card required)

1. Create a free project at <https://supabase.com/dashboard>.
2. In **Project Settings → API**, copy the Project URL, anon key and service
   role key. Put **only** the first two values you need into `.env.local`; the
   service role key must stay server-side and out of any Android build.
3. Apply the migration with either:
   - **Dashboard**: open **SQL Editor**, paste `migrations/0001_init.sql`, run it.
   - **Supabase CLI** (from a Codespace terminal):
     ```bash
     npx supabase login
     npx supabase link --project-ref <your-project-ref>
     npx supabase db push
     ```
4. Verify `GET /api/health` reports `database.configured: true` after a restart.

## Security rules

- Every table has RLS enabled with owner-only policies scoped to `auth.uid()`.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. `createSupabaseAdminClient()` is
  guarded by `server-only` and must never be imported by a Client Component or
  bundled into an APK.
- Do not commit `.env.local`, keystores or generated keys. `.gitignore` already
  excludes `.env*` except `.env.example`.

## Next stage (needs approval)

- Replace `lib/db/types.ts` with generated types:
  `npx supabase gen types typescript --linked > lib/db/generated.types.ts`.
- Add an RPC function for vector similarity search and an HNSW index once real
  embeddings exist.
- Wire Supabase Auth and conversation persistence into the chat UI.
