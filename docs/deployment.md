# Cloud deployment (free tier, Android-phone workflow)

Everything below works from a phone browser. No purchase, credit card, local
Android SDK or model training is required.

## 1. Development environment

- **GitHub Codespaces**: open the repo in a browser and let
  `.devcontainer/devcontainer.json` install Node 22 + dependencies. GitHub Free
  includes a monthly Codespaces allowance — stop the Codespace when you finish.
  See <https://docs.github.com/en/billing/concepts/product-billing/github-codespaces>.
- **Alternative**: this repository is plain npm + Next.js; any cloud IDE with a
  terminal works. GitHub's web editor and the GitHub mobile app handle small
  edits, PR reviews and CI results.
- A Bluetooth keyboard makes the Codespaces editor far more usable on a phone.

## 2. Continuous integration

`.github/workflows/ci.yml` runs on pushes, PRs and manual dispatch:

1. `npm ci` (Node from `.nvmrc`)
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. A second job installs Chromium and runs `npm run test:e2e` (desktop +
   mobile viewport) against `npm run start`.

GitHub Actions is free for standard runners on public repositories; private
repositories use the included monthly minutes. Playwright reports are uploaded
as artifacts on failure.

## 3. Vercel

1. Create a new project from this GitHub repository; Vercel auto-detects
   Next.js. `vercel.json` pins the install/build commands.
2. Set **Node.js 22** in *Settings → General → Node.js Version* (or keep the
   `engines.node` constraint). Next.js 16 requires Node >= 20.9; AI SDK 7 and
   Supabase JS require Node >= 22.
3. Add environment variables in *Settings → Environment Variables*. Never put
   secrets in `NEXT_PUBLIC_*` variables:

   | Variable | Where | Required for foundation? |
   |---|---|---|
   | `NEXT_PUBLIC_APP_NAME` | all | optional (fallback exists) |
   | `NEXT_PUBLIC_APP_URL` | all | optional |
   | `AI_BASE_URL` | server | no — only to enable chat |
   | `AI_API_KEY` | server | no — **secret** |
   | `AI_MODEL` | server | no |
   | `AI_PROVIDER_NAME` | server | optional |
   | `AI_MAX_OUTPUT_TOKENS` | server | optional (default 1024) |
   | `AI_REQUEST_TIMEOUT_MS` | server | optional (default 30000) |
   | `SUPABASE_URL` | server | no — only to enable DB |
   | `SUPABASE_ANON_KEY` | server | no |
   | `SUPABASE_SERVICE_ROLE_KEY` | server | no — **secret** |
   | `LOG_LEVEL` | all | optional (`info` default) |

4. Every PR gets a preview URL you can open directly in phone Chrome. Vercel
   Hobby is free but restricted to **non-commercial personal use**; verify the
   current limits at <https://vercel.com/docs/plans/hobby>. Hobby functions run
   in a single region (default US East) — change to a nearer region in the
   dashboard if latency matters.
5. After deployment, check `https://<your-app>/api/health`. It returns
   `200` with `integrations.ai.configured` / `integrations.database.configured`
   booleans. `not_configured` is an intentional, documented state, not a bug.

## 4. AI provider (only when you want real chat)

Use any OpenAI-compatible endpoint with a free tier (e.g. Groq, OpenRouter
`:free` variants, Hugging Face Inference Providers). Set `AI_BASE_URL`,
`AI_API_KEY`, `AI_MODEL` to real values from that provider's dashboard. Free
model catalogs and rate limits change often — verify them at signup. No card is
needed for the foundation itself.

Test locally:

```bash
curl -sS http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"stream":false}'
```

With no provider configured the same request returns `503` with code
`AI_NOT_CONFIGURED`. It never returns a canned answer.

## 5. Database (optional)

See `supabase/README.md`. Supabase Free provides a small Postgres instance with
RLS; projects pause after a week of inactivity. The migration is applied
manually from the dashboard or the Supabase CLI — nothing auto-creates tables.

## 6. Android testing without a laptop

- Open the Vercel preview URL in Chrome on your phone; use *Add to Home screen*
  to test the PWA manifest.
- Run the Playwright mobile-viewport project in GitHub Actions; inspect the
  uploaded report from the GitHub mobile app.
- Capacitor APK builds are a later stage: a `ubuntu-latest` Actions job installs
  the Android command-line tools, runs Gradle and uploads a debug APK artifact
  you can download and sideload on the phone. No Play Console account needed.
- USB `adb` debugging is not available in this cloud-only loop; use the
  structured logs, Vercel runtime logs and the in-page status card instead.

## 7. Services deliberately avoided

- Firebase Studio (closed to new workspaces, sunsets 2027-03-22).
- GitHub Models (retired 2026-07-30).
- Any paid GPU host, paid Vercel tier, domain purchase or Play Console fee.

## 8. Rollback

Vercel keeps previous deployments; promote a prior production deployment from
the dashboard. Reverting a git commit and pushing re-runs CI and creates a new
preview.
