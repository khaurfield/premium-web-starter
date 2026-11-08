import {
  Activity,
  ArrowRight,
  Cloud,
  Database,
  FlaskConical,
  KeyRound,
  Layers,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
} from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SystemStatus } from "@/components/system-status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const foundationFeatures = [
  {
    icon: Layers,
    title: "Frontend foundation",
    body: "Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, responsive dark-mode-ready primitives and accessible reusable components.",
  },
  {
    icon: Server,
    title: "Typed API boundary",
    body: "Zod-validated requests, correlation ids, a uniform JSON envelope, one error hierarchy, and structured redacting logs on every route.",
  },
  {
    icon: KeyRound,
    title: "Server-only secrets",
    body: "Environment is parsed lazily with Zod and guarded by `server-only`. API keys never reach client bundles or the health endpoint.",
  },
  {
    icon: Activity,
    title: "Real AI provider boundary",
    body: "`/api/chat` streams from a real OpenAI-compatible endpoint or returns a typed 503. It never produces a fabricated assistant message.",
  },
  {
    icon: Database,
    title: "Database prepared",
    body: "Supabase client factories, hand-written schema types and an RLS-enabled SQL migration for conversations, messages and RAG chunks.",
  },
  {
    icon: Cloud,
    title: "Cloud-ready",
    body: "Pinned Node version, devcontainer, GitHub Actions CI with unit + browser tests, Vercel build config and security headers.",
  },
] as const;

const nextStages = [
  {
    icon: Terminal,
    title: "Chat interface",
    body: "Streaming assistant UI with the AI SDK React hooks. Requires your approval and a configured provider.",
  },
  {
    icon: ShieldCheck,
    title: "Auth & RAG",
    body: "Supabase Auth, conversation persistence and pgvector retrieval over your own notes.",
  },
  {
    icon: Smartphone,
    title: "Android app",
    body: "Capacitor wrapper built as a debug APK in GitHub Actions, then sideloaded on your phone.",
  },
  {
    icon: FlaskConical,
    title: "On-device models",
    body: "Optional LiteRT-LM inference behind a feature flag. No model training in this plan.",
  },
] as const;

const setupSteps = [
  {
    command: "npm ci",
    detail: "Install the exact dependency tree from package-lock.json.",
  },
  {
    command: "cp .env.example .env.local",
    detail: "Add real provider/database credentials locally; never commit that file.",
  },
  {
    command: "npm run dev",
    detail: "Start the Turbopack dev server on port 3000.",
  },
  {
    command: "npm run check",
    detail: "Lint, typecheck, unit tests and production build in one command.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-surface">
          <Container className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
            <div className="space-y-6">
              <Badge variant="info">
                <span className="h-1.5 w-1.5 rounded-full bg-info" />
                Foundation stage · v0.1.0
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                A serious base for your personal AI assistant.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                This repository now contains the professional foundation: a
                typed Next.js frontend, a secure API layer, real (not simulated)
                AI provider wiring, a prepared database schema, tests and cloud
                deployment configuration. The assistant UI and Android app are
                deliberate later stages.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="#status" className={cn(buttonVariants({ size: "lg" }))}>
                  View live status <ArrowRight aria-hidden="true" size={16} />
                </Link>
                <Link
                  href="#architecture"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  Read the architecture
                </Link>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>What is implemented now</CardTitle>
                <CardDescription>
                  Verified by lint, typecheck, unit tests and a production build.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {[
                    "Next.js 16 + React 19 + strict TypeScript",
                    "Responsive Tailwind CSS 4 design system",
                    "Reusable accessible UI primitives",
                    "GET /api/health and POST /api/chat",
                    "Server-only, Zod-validated environment",
                    "Structured logging with secret redaction",
                    "Supabase migration + typed client factories",
                    "Vitest, Playwright and GitHub Actions CI",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Container>
        </section>

        {/* Live status */}
        <section className="py-14 sm:py-16">
          <Container>
            <SystemStatus />
          </Container>
        </section>

        {/* Architecture */}
        <section id="architecture" className="scroll-mt-20 border-y border-border bg-surface py-16">
          <Container className="space-y-10">
            <div className="max-w-3xl space-y-4">
              <Badge variant="neutral">Architecture</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                One codebase, clear boundaries
              </h2>
              <p className="text-base leading-relaxed text-muted">
                The web app is a thin backend-for-frontend. AI inference happens
                at a real external provider, never inside a serverless function.
                Data access is isolated behind typed factories so the same code
                can later serve a Capacitor Android client.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {foundationFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="h-full">
                    <CardHeader>
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.body}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API surface</CardTitle>
                <CardDescription>
                  Both routes go through `withApiRoute`: correlation id,
                  structured logs, typed errors and `Cache-Control: no-store`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs sm:text-sm">
                <p className="rounded-lg border border-border bg-background p-3">
                  GET /api/health → 200 JSON · liveness + integration states
                </p>
                <p className="rounded-lg border border-border bg-background p-3">
                  POST /api/chat → text stream (default) or JSON · real provider
                  only
                </p>
                <p className="rounded-lg border border-border bg-background p-3">
                  POST /api/chat (unconfigured) → 503 · code AI_NOT_CONFIGURED
                </p>
              </CardContent>
            </Card>
          </Container>
        </section>

        {/* Setup */}
        <section id="setup" className="scroll-mt-20 py-16">
          <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Badge variant="neutral">Local &amp; cloud setup</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Works from an Android phone
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Use GitHub Codespaces in a browser (the included devcontainer
                pins Node 22), run checks in GitHub Actions, and review Vercel
                preview deployments on your phone. No local Android SDK or paid
                service is required for this stage.
              </p>
              <p className="text-sm text-muted">
                All integration credentials are optional right now. Without them
                the app still builds, boots and reports exactly which
                integrations are missing.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Getting started</CardTitle>
                <CardDescription>
                  Node.js 22.12+ and npm 10+ are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {setupSteps.map((step, index) => (
                    <li key={step.command} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <code className="rounded bg-background px-2 py-1 font-mono text-sm">
                          {step.command}
                        </code>
                        <p className="mt-1.5 text-sm text-muted">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </Container>
        </section>

        {/* Roadmap */}
        <section className="border-t border-border bg-surface py-16">
          <Container className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <Badge variant="warning">Not implemented yet</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Deliberately deferred stages
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Nothing below is presented as complete. Each stage needs your
                approval before work begins.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {nextStages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <Card key={stage.title}>
                    <CardHeader>
                      <Icon aria-hidden="true" size={20} className="mb-2 text-muted" />
                      <CardTitle className="text-base">{stage.title}</CardTitle>
                      <CardDescription>{stage.body}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
