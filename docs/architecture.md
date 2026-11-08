# Architecture (foundation stage)

## Scope

This stage delivers the **professional foundation** only. Implemented: Next.js
frontend architecture, strict TypeScript, responsive styling, reusable UI
components, backend structure, database *integration preparation*, secure env
handling, API routes, error handling, logging, tests, docs and cloud deployment
configuration.

**Not implemented (deliberate):** chat UI, authentication, RAG queries,
Capacitor/Android builds, on-device models, fine-tuning/training. None of these
are simulated or stubbed with fake output.

## Layers

```
Browser / phone (PWA-capable)
  └─ app/                     Next.js 16 App Router, React 19, Tailwind CSS 4
      ├─ page.tsx             server-rendered landing + live status
      ├─ error.tsx            client error boundary → structured log
      ├─ global-error.tsx     root-layout failure boundary
      └─ api/
          ├─ health/route.ts  GET  liveness + integration configuration state
          └─ chat/route.ts    POST real provider call (stream or JSON)
                 │
                 ├─ lib/api/       contracts (Zod), envelope, withApiRoute
                 ├─ lib/errors.ts  typed AppError + toAppError
                 ├─ lib/logging/   JSON lines with secret redaction
                 ├─ lib/env.ts     server-only, lazy Zod validation
                 ├─ lib/ai/        config + provider (AI SDK v7)
                 └─ lib/db/        config + typed Supabase factories
                        │
                        └─ supabase/migrations/0001_init.sql (RLS + pgvector)
```

## Request lifecycle

1. `withApiRoute` derives/validates a correlation id (`x-request-id`), creates a
   request-scoped logger and logs `request.started` (path only, never query).
2. The handler parses the body with a strict Zod schema. Invalid input becomes
   `VALIDATION_ERROR` (400) with field-level details.
3. Success → `jsonOk` envelope `{ ok: true, data, requestId }`; streaming →
   `createTextStreamResponse` with `text/plain; charset=utf-8` deltas.
4. Any throw → `toAppError` → `request.failed` log → `jsonError` envelope with a
   safe message. Internal messages and secrets never reach the client.
5. Every response carries `Cache-Control: no-store` and `x-request-id`.

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Body is not valid JSON |
| `VALIDATION_ERROR` | 400 | Zod schema rejected the payload |
| `AI_NOT_CONFIGURED` | 503 | Missing AI credentials; **never** a fake answer |
| `AI_UPSTREAM_ERROR` | 502 | Configured provider failed |
| `DATABASE_NOT_CONFIGURED` | 503 | Missing Supabase credentials |
| `CONFIGURATION_ERROR` | 500 | Invalid server environment |
| `TIMEOUT` | 504 | Client abort or provider timeout |
| `INTERNAL_ERROR` | 500 | Unexpected failure (message hidden) |

## AI boundary

- `lib/ai/config.ts` requires all three of `AI_BASE_URL`, `AI_API_KEY`,
  `AI_MODEL`. Missing any one → `AI_NOT_CONFIGURED`.
- `lib/ai/provider.ts` uses the Vercel AI SDK (`ai` 7 +
  `@ai-sdk/openai-compatible`) against any OpenAI-compatible endpoint. It
  applies a server-side timeout, forwards client cancellation, and supports
  `stream: true` (default, plain-text deltas) or `stream: false` (JSON).
- Zero fabricated text. Cached/static completions, mock providers and canned
  assistant replies are explicitly out of scope.
- Inference never runs inside a Vercel Function (no GPU, 2 GB RAM, 300 s cap on
  Hobby); the function is a thin orchestrator.

## Database boundary

- `lib/db/config.ts` and `lib/db/client.ts` are `server-only`.
- The migration enables RLS and owner-only policies; the admin client uses the
  service-role key and is never exposed to browsers or APKs.
- Schema types are hand-written and will be replaced by generated types in the
  next stage.

## Security decisions

- `server-only` guards every module that reads secrets; `lib/public-env.ts`
  exposes only `NEXT_PUBLIC_*` values.
- The health probe returns booleans, never values or an env dump.
- The logger redacts secret-looking keys and values and never logs query strings.
- Framework-level security headers are set in `next.config.ts` (nosniff,
  frame denial, referrer policy, permissions policy, HSTS). A CSP is deferred
  until nonces are implemented so it cannot silently break Next.js bootstrap
  scripts.
- CSP, rate limiting, auth and a secrets rotation policy are the next security
  stage.

## Frontend decisions

- Tailwind CSS 4 is configured in CSS (`@theme`), not JS; light/dark palettes
  follow `prefers-color-scheme`. All layout is mobile-first with `sm:`/`lg:`
  breakpoints, and a PWA manifest is included.
- UI primitives in `components/ui/` are presentational, typed, accessible and
  class-variance based; composed sections live in `components/`.
- No `next/font/google` is used, so production builds require no font download.

## Android path (future)

Capacitor requires a static export or a remote URL. The current app uses
server-side route handlers, so it is **not** yet static-exportable. In the
approved next stages the chat UI becomes a client SPA calling this hosted API,
then a Capacitor 8 wrapper is built as a debug APK in GitHub Actions.
