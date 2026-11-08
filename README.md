# premium-web-starter

> A professional, reusable Next.js starter for building modern websites, web
> applications, SaaS platforms and dashboards, with optional Android APK
> support through Capacitor. — original project intent (preserved below in
> expanded, accurate form).

**Current status: foundation stage (v0.1.0).** This repository now contains a
working, tested Next.js 16 foundation for a **personal AI assistant**: a typed
frontend, a secure API layer, real (not simulated) AI provider wiring, a
prepared database schema, tests, and cloud deployment configuration.

Read this carefully: the assistant chat UI, authentication, RAG, the Android
application and on-device models are **planned later stages** and are not
implemented. Nothing in this repository pretends they are.

---

## 1. What is actually implemented

| Area | Delivered |
|---|---|
| Frontend architecture | Next.js 16.4.5 App Router, React 19.3.1, `app/` layout + page + error/loading/not-found boundaries, metadata and PWA manifest |
| TypeScript | Strict `tsconfig.json` (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`), `@/*` path alias, pinned `@types/*` |
| Responsive styling | Tailwind CSS 4.3.5 configured in CSS (`@theme`), mobile-first layout, automatic light/dark palettes, reduced-motion support, system fonts (no build-time font download) |
| Reusable components | `components/ui/`: `Button`, `Card` (+ header/title/description/content/footer), `Badge`, `Input`, `Alert`, `Container`; composed `SiteHeader`, `SiteFooter`, `SystemStatus` |
| Backend structure | `lib/api/`, `lib/ai/`, `lib/db/`, `lib/logging/`, `lib/env.ts`, `lib/errors.ts`, `lib/public-env.ts` — layered, `server-only` guarded |
| Database integration | `supabase/migrations/0001_init.sql` (5 tables, `pgvector`, indexes, triggers, RLS), typed schema in `lib/db/types.ts`, config + client factories |
| Secure environment | Lazy Zod validation, `server-only` guard, `.env.example` template, `.gitignore` excludes all real `.env*` files, no key ever logged or returned |
| API routes | `GET /api/health`, `POST /api/chat` (streaming or JSON, real provider only) |
| Error handling | One `AppError` hierarchy, `toAppError` normalisation, safe JSON envelopes, 3 React error boundaries |
| Logging | Structured JSON lines, levels, request ids, secret redaction, path-only URL logging |
| Testing | Vitest unit/integration tests, `happy-dom` component tests, Playwright E2E (desktop + mobile), coverage config |
| Cloud deployment | `vercel.json`, `.devcontainer/`, `.github/workflows/ci.yml`, `dependabot.yml`, `.nvmrc`, security headers in `next.config.ts` |
| Documentation | This README, `docs/architecture.md`, `docs/deployment.md`, `supabase/README.md`, `AGENTS.md` |

**Preserved from the initial commit:** `LICENSE` (MIT, unchanged), `.gitignore`
(extended, original rules kept), and the README's description/purpose above.
Nothing was deleted.

---

## 2. Requirements

- **Node.js >= 22.12.0** (`.nvmrc` pins `22`). Next.js 16 needs >= 20.9; the
  AI SDK 7 and Supabase JS packages used here need >= 22.
- **npm 10+** (a committed `package-lock.json` makes `npm ci` reproducible).
- A browser. For an Android-only workflow see `docs/deployment.md`.

---

## 3. Quick start

```bash
npm ci
cp .env.example .env.local      # optional: all integrations are off by default
npm run dev                     # http://localhost:3000
```

No credentials are needed to install, build, boot or test the foundation.

| Script | What it does |
|---|---|
| `npm run dev` | Turbopack dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint 9 flat config (`eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit + integration tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with v8 coverage |
| `npm run test:e2e` | Playwright (run `npx playwright install chromium` once) |
| `npm run check` | lint + typecheck + unit tests + production build |

---

## 4. Project structure

```
.
├── app/
│   ├── layout.tsx / page.tsx / globals.css
│   ├── error.tsx / global-error.tsx / not-found.tsx / loading.tsx
│   └── api/
│       ├── health/route.ts        GET  readiness + integration state
│       └── chat/route.ts          POST real provider, stream or JSON
├── components/
│   ├── site-header.tsx / site-footer.tsx / system-status.tsx
│   └── ui/  button, card, badge, input, alert, container
├── lib/
│   ├── app-info.ts / public-env.ts / env.ts / errors.ts / utils.ts
│   ├── api/         contracts.ts (Zod), response.ts (envelope + wrapper)
│   ├── ai/          config.ts, messages.ts, provider.ts (AI SDK v7)
│   ├── db/          config.ts, client.ts, types.ts
│   └── logging/     logger.ts (redaction, levels, JSON lines)
├── supabase/migrations/0001_init.sql
├── tests/{unit,e2e,stubs}/  +  setup.ts
├── docs/            architecture.md, deployment.md
├── .github/         workflows/ci.yml, dependabot.yml
├── .devcontainer/devcontainer.json
├── AGENTS.md        guidance for AI coding agents
├── eslint.config.mjs / vitest.config.ts / playwright.config.ts
├── next.config.ts / postcss.config.mjs / tsconfig.json / vercel.json
├── .env.example / .nvmrc / .editorconfig / .gitignore
└── package.json / package-lock.json / LICENSE / README.md
```

---

## 5. Architecture summary

The app is a thin **backend-for-frontend**. UI is server-rendered where
possible; the one interactive client component (`SystemStatus`) calls
`/api/health`. AI inference happens at an external OpenAI-compatible provider,
never inside a serverless function. Data access is isolated behind typed,
`server-only` factories so the same API can later serve a Capacitor Android
client.

Every request flows through `withApiRoute`:

```
request → correlation id → structured log → Zod validation
        → handler → jsonOk / text stream
        → any throw → toAppError → request.failed log → safe JSON error
```

See `docs/architecture.md` for the full layer diagram, error-code table and
security decisions.

---

## 6. Environment variables

Copy `.env.example` to `.env.local`. Every variable is **optional** for the
foundation; the app reports exactly what is missing at `/api/health`.

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | browser | Display name (fallback: "Personal AI Assistant") |
| `NEXT_PUBLIC_APP_URL` | browser | Canonical URL |
| `AI_BASE_URL` | server only | OpenAI-compatible base URL, e.g. `https://api.groq.com/openai/v1` |
| `AI_API_KEY` | **server secret** | Provider key |
| `AI_MODEL` | server only | Real model id from your provider |
| `AI_PROVIDER_NAME` | server only | Label used in logs/headers (default `openai-compatible`) |
| `AI_MAX_OUTPUT_TOKENS` | server only | Cap per completion (default 1024) |
| `AI_REQUEST_TIMEOUT_MS` | server only | Hard timeout (default 30000) |
| `SUPABASE_URL` | server only | Supabase project URL |
| `SUPABASE_ANON_KEY` | server only | Public/anon key (still never inlined into the APK) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server secret** | Bypasses RLS; server-only |
| `LOG_LEVEL` | all | `debug` \| `info` \| `warn` \| `error` |

**Rules:** never prefix a secret with `NEXT_PUBLIC_`; never commit `.env.local`;
never log or return secret values; never ship the service-role key in an APK.
`lib/env.ts` validates with Zod at request time (not at build time) so a build
never needs real credentials.

---

## 7. API reference

### `GET /api/health`

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "requestId": "…",
    "timestamp": "2026-11-08T…",
    "integrations": {
      "ai": { "state": "not_configured", "configured": false },
      "database": { "state": "not_configured", "configured": false }
    }
  },
  "requestId": "…"
}
```

Never contains secret values or an environment dump.

### `POST /api/chat`

```bash
# JSON mode
curl -sS http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}],"stream":false}'

# Streaming mode (default) — plain UTF-8 text deltas
curl -N http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

- `messages`: 1–50 items, roles `system` | `user` | `assistant`, content up to
  32,000 characters.
- `stream` (default `true`): `text/plain; charset=utf-8` delta stream.
- `maxOutputTokens`: optional per-request cap.
- **Without provider credentials:** `503` with code `AI_NOT_CONFIGURED` and
  setup instructions. No canned, mocked or "demo" assistant text is ever
  generated.
- **With credentials:** every token comes from the configured real provider.

---

## 8. Database

`supabase/migrations/0001_init.sql` is prepared but **not applied**. It defines
`profiles`, `conversations`, `messages`, `documents`, `document_chunks`
(`extensions.vector(1536)`), owner-only RLS policies, indexes and
`updated_at` triggers. See `supabase/README.md` for free-tier application steps
and the service-role-key warning.

---

## 9. Testing

```bash
npm run lint
npm run typecheck
npm test                    # Vitest: env, errors, logging, contracts, routes, UI
npm run test:coverage
npx playwright install chromium
npm run test:e2e            # needs a built app (`npm run build`)
npm run check               # everything except E2E
```

`tests/unit` uses an inert `server-only` stub (configured in
`vitest.config.ts`) so modules can be tested in plain Node. Playwright covers
the home page, the health envelope and a 360 px phone viewport. GitHub Actions
runs all of it on every push/PR.

---

## 10. Cloud deployment & phone-first workflow

- `vercel.json` + Next.js auto-detection for preview/production deploys.
- `.devcontainer/devcontainer.json` for GitHub Codespaces (browser VS Code on
  an Android phone); `.nvmrc` pins Node 22 everywhere.
- `.github/workflows/ci.yml` runs lint, typecheck, unit tests, build and
  Playwright; `dependabot.yml` keeps dependencies current.
- Security headers live in `next.config.ts`.
- Full free-tier, no-purchase instructions, env matrix and Android testing
  notes: **`docs/deployment.md`**.

There is no paid service, domain, GPU instance, Play Console account or model
training involved in this stage.

---

## 11. Roadmap — needs your approval before each stage

1. **Chat UI** — streaming assistant interface with AI SDK React hooks.
2. **Auth & persistence** — Supabase Auth, conversations, generated DB types.
3. **RAG** — embeddings, `pgvector` RPC + ANN index over your own notes.
4. **Android** — PWA polish, Capacitor 8 wrapper, debug APK in GitHub Actions.
5. **On-device models** — optional LiteRT-LM (Gemma/Qwen) behind a feature flag.

See `docs/architecture.md` and `docs/deployment.md` for the rationale and the
phone-only workflow.

---

## License

MIT — see `LICENSE` (unchanged from the initial commit).
