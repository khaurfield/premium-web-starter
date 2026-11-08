# AGENTS.md — guidance for coding agents

This repository is a **foundation-stage** Next.js 16 project for a personal AI
assistant (website now, Android app later). Read this file before changing code.

## Project facts

- Next.js 16.4.5 App Router, React 19.3.1, TypeScript 5.9.3 (strict),
  Tailwind CSS 4.3.5 (CSS-first config, no `tailwind.config.*`).
- Node.js >= 22.12.0 (`.nvmrc` pins 22). npm is the package manager;
  `package-lock.json` is committed and CI uses `npm ci`.
- Version-matched Next.js docs live in `node_modules/next/dist/docs/`.
  Prefer those over memorised Next.js 14/15 APIs.

## Commands

```
npm ci              # install exactly what the lockfile says
npm run dev         # Turbopack dev server
npm run lint        # ESLint 9 flat config
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit/integration tests
npm run test:e2e    # Playwright (needs `npx playwright install chromium`)
npm run build       # production build
npm run check       # all of the above except e2e
```

## Non-negotiable rules

1. **Never expose secrets.** Server secrets are read only in modules that import
   `server-only` (`lib/env.ts`, `lib/ai/*`, `lib/db/*`). Only `NEXT_PUBLIC_*`
   values may reach client code. Never log keys, tokens, or full env objects.
2. **No fake AI responses.** `/api/chat` either calls the configured real
   OpenAI-compatible provider or returns a typed, structured configuration
   error. Never return canned "assistant" text.
3. **No placeholder endpoints that pretend to work.** Unconfigured integrations
   must produce an explicit, documented, testable error state.
4. **Validate at the boundary.** All request bodies are parsed with Zod in
   `lib/api/contracts.ts`; all errors go through `lib/errors.ts` and
   `lib/api/response.ts`; all significant events go through `lib/logging`.
5. **Do not start the next stage** without approval: server-side auth,
   conversation persistence, RAG/pgvector queries, Capacitor/Android builds,
   on-device models, and model training are intentionally out of scope for
   the current stage. The responsive chat UI at `/chat` IS implemented.
6. Preserve `LICENSE`, `.gitignore` and the intent of `README.md`. Do not delete
   useful existing files.

## Layout

```
app/                     routes, layouts, global CSS, error boundaries
app/api/health/          real readiness/configuration probe
app/api/models/          browser-safe, server-configured model catalog
app/api/chat/            real, config-gated streaming chat endpoint
app/chat/                responsive assistant workspace
components/ui/           reusable, accessible primitives (Radix wrappers)
components/chat/         conversation sidebar, messages, composer
components/settings/     theme, preferences, profile dialogs
components/providers/    theme + local state provider
hooks/                   streaming chat, browser speech recognition
lib/client/              browser-safe storage, preferences, attachments
lib/env.ts               server-only Zod-validated environment
lib/public-env.ts        browser-safe configuration
lib/errors.ts            typed error hierarchy
lib/api/                 request wrapper, JSON responses, Zod contracts
lib/logging/             structured, redacting logger
lib/ai/                  provider factory + streaming client
lib/db/                  Supabase client factory + typed schema
supabase/migrations/     SQL schema (not yet applied)
tests/unit/              Vitest tests
tests/e2e/               Playwright specs
docs/                    architecture and deployment notes
```
