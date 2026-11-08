import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Cloud,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  KeyRound,
  Layers,
  MessageSquare,
  Mic,
  Moon,
  PanelLeft,
  Paperclip,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

const features = [
  {
    icon: MessageSquare,
    title: "A real chat workspace",
    body: "Streaming replies, working stop and retry, a responsive composer and a message history that scrolls cleanly on a phone.",
  },
  {
    icon: PanelLeft,
    title: "Conversation sidebar",
    body: "Create, search, rename and delete conversations. History is saved in this browser and clearly labelled as local-only.",
  },
  {
    icon: Cpu,
    title: "Model selection",
    body: "The selector reads a server-side allow-list and really changes the model used for each request. No decorative dropdowns.",
  },
  {
    icon: Paperclip,
    title: "File & image attachments",
    body: "Text files are read locally and added to your prompt. Images become genuine provider image parts, with previews and limits.",
  },
  {
    icon: Mic,
    title: "Voice dictation",
    body: "Browser speech recognition fills the composer where supported. Where it is not, the control is disabled with a reason.",
  },
  {
    icon: Moon,
    title: "Themes & settings",
    body: "Light, dark and system themes with no flash, plus real preferences for streaming, keyboard behaviour, text size and instructions.",
  },
] as const;

const trustPoints = [
  { icon: KeyRound, label: "Server-only keys" },
  { icon: ShieldCheck, label: "No simulated answers" },
  { icon: Smartphone, label: "Android-friendly" },
  { icon: HardDrive, label: "Local history" },
] as const;

const flowSteps = [
  {
    icon: Smartphone,
    number: "01",
    title: "Your browser",
    body: "You type, attach a file or image, or dictate. The composer builds a validated request and sends it to this app's API.",
  },
  {
    icon: Server,
    number: "02",
    title: "Typed server boundary",
    body: "Zod validates every request, a correlation id is attached, and errors and logs go through one structured, redacting layer.",
  },
  {
    icon: Cloud,
    number: "03",
    title: "Your AI provider",
    body: "An OpenAI-compatible endpoint streams real tokens back. The key never reaches the browser; nothing is fabricated in between.",
  },
] as const;

const setupSteps = [
  {
    command: "npm ci",
    detail: "Install the exact dependency tree from package-lock.json.",
  },
  {
    command: "cp .env.example .env.local",
    detail: "Add your provider credentials locally. .env.local is git-ignored.",
  },
  {
    command: "npm run dev",
    detail: "Open the app, then go to /chat to use the assistant workspace.",
  },
  {
    command: "npm run check",
    detail: "Lint, typecheck, unit tests and a production build in one command.",
  },
] as const;

const envRows = [
  { name: "AI_BASE_URL", purpose: "OpenAI-compatible chat completions base URL", required: "Required for chat" },
  { name: "AI_API_KEY", purpose: "Server-only provider credential", required: "Required for chat" },
  { name: "AI_MODEL", purpose: "Default model id", required: "Required for chat" },
  { name: "AI_MODELS", purpose: "Optional allow-list shown in the model selector", required: "Optional" },
  { name: "AI_VISION_MODELS", purpose: "Optional ids marked as vision-capable", required: "Optional" },
  { name: "SUPABASE_*", purpose: "Prepared database client configuration", required: "Not used by the UI yet" },
] as const;

const deferred = [
  { icon: ShieldCheck, title: "Accounts & auth", body: "No sign-in yet. The profile is a local display name." },
  { icon: Database, title: "Cloud conversation sync", body: "History is local; the Supabase migration is not applied." },
  { icon: Layers, title: "RAG & embeddings", body: "Schema is prepared, but no retrieval pipeline is wired up." },
  { icon: Terminal, title: "Android & on-device models", body: "Capacitor and LiteRT-LM remain deliberate later stages." },
] as const;

const REPOSITORY_URL = "https://github.com/khaurfield/premium-web-starter";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden border-b border-border bg-surface">
          <div aria-hidden="true" className="hero-aurora absolute inset-0" />
          <div aria-hidden="true" className="grid-fade absolute inset-0 opacity-60" />
          <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-24">
            <div className="animate-fade-up space-y-7">
              <Badge variant="info" className="border-primary/25 bg-primary/10 text-primary">
                <Sparkles aria-hidden="true" size={13} />
                Frontend ready · real provider boundary
              </Badge>
              <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                A personal AI assistant,{" "}
                <span className="text-gradient">built to be yours.</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                A premium, responsive chat workspace on a strictly typed Next.js
                foundation. Real streaming from your own provider, local
                conversation history, model control, attachments and voice input —
                with no sample answers and no secrets in the browser.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/chat" className={cn(buttonVariants({ size: "lg" }))}>
                  Open the assistant <ArrowRight aria-hidden="true" size={17} />
                </Link>
                <a
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  View the code <ExternalLink aria-hidden="true" size={15} />
                </a>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {trustPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <li key={point.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Icon aria-hidden="true" size={14} className="text-primary" />
                      {point.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Honest API illustration: real request shape, no invented chat. */}
            <div className="animate-fade-up [animation-delay:120ms]">
              <Card className="overflow-hidden rounded-2xl border-border/80 bg-surface/95 app-shadow-lg backdrop-blur">
                <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  <span className="ml-2 font-mono text-[0.6875rem] text-muted">
                    POST /api/chat
                  </span>
                  <Badge variant="success" className="ml-auto text-[0.625rem]">
                    <Activity aria-hidden="true" size={11} /> live boundary
                  </Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  <pre className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-[0.6875rem] leading-relaxed text-muted">{`{
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true,
  "model": "from GET /api/models",
  "images": [{ "kind": "image", "mediaType": "…", "data": "…" }]
}`}</pre>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-success/25 bg-success/5 p-3">
                      <p className="font-mono text-[0.6875rem] font-semibold text-success">
                        200 · text/plain
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Provider deltas stream straight to the message bubble.
                      </p>
                    </div>
                    <div className="rounded-xl border border-warning/25 bg-warning/5 p-3">
                      <p className="font-mono text-[0.6875rem] font-semibold text-warning">
                        503 · AI_NOT_CONFIGURED
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        A typed setup state — never a canned assistant reply.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    {["Next.js 16", "React 19", "TypeScript strict", "Tailwind 4"].map((tag) => (
                      <Badge key={tag} variant="neutral" className="text-[0.625rem]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="scroll-mt-20 py-16 sm:py-20">
          <Container className="space-y-10">
            <div className="max-w-2xl space-y-3">
              <Badge variant="neutral">The workspace</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Designed to feel finished
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Every control below is connected to real behaviour. Buttons that
                cannot work yet are disabled with an explanation rather than left
                as decoration.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="h-full transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                      <CardDescription>{feature.body}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ---------- How it works ---------- */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-y border-border bg-surface py-16 sm:py-20"
        >
          <Container className="space-y-10">
            <div className="max-w-2xl space-y-3">
              <Badge variant="neutral">Architecture</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Three honest boundaries
              </h2>
              <p className="text-base leading-relaxed text-muted">
                The web app is a thin, secure frontend. Inference happens at a
                real external provider, and your conversation data stays in the
                browser until cloud sync is implemented.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {flowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.number} className="relative h-full">
                    <CardHeader>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
                          <Icon aria-hidden="true" size={20} />
                        </span>
                        <span className="font-mono text-xs text-muted">{step.number}</span>
                      </div>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <CardDescription>{step.body}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-card border border-border bg-background p-5 sm:flex-row sm:items-center">
              <KeyRound aria-hidden="true" size={20} className="shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted">
                <strong className="font-semibold text-foreground">Keys stay server-side.</strong>{" "}
                Only <code className="font-mono">NEXT_PUBLIC_*</code> values reach
                client code. The model catalog exposes ids and labels, never
                credentials or environment values.
              </p>
            </div>
          </Container>
        </section>

        {/* ---------- Live status ---------- */}
        <section id="status" className="scroll-mt-20 py-16 sm:py-20">
          <Container className="space-y-6">
            <div className="max-w-2xl space-y-3">
              <Badge variant="neutral">Runtime</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Live system status
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Read from the real health endpoint. An unconfigured integration is
                reported as such instead of being hidden.
              </p>
            </div>
            <SystemStatus />
          </Container>
        </section>

        {/* ---------- Setup ---------- */}
        <section id="setup" className="scroll-mt-20 border-t border-border bg-surface py-16 sm:py-20">
          <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <Badge variant="neutral">Setup</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Works from an Android phone
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Use GitHub Codespaces in a browser or GitHub Actions for checks.
                Node 22+ and npm are pinned in the devcontainer and CI. No local
                Android SDK or paid service is needed for this stage.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                All integration credentials are optional. Without them the app
                builds, boots and shows exactly what is missing — the chat UI
                then surfaces a typed configuration error instead of inventing a
                reply.
              </p>
              <a
                href={`${REPOSITORY_URL}/blob/main/docs/deployment.md`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
              >
                Full deployment notes <ExternalLink aria-hidden="true" size={13} />
              </a>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Getting started</CardTitle>
                  <CardDescription>Node.js 22.12+ and npm 10+ required.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {setupSteps.map((step, index) => (
                      <li key={step.command} className="flex gap-3.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <code className="break-all rounded-md bg-background px-2 py-1 font-mono text-xs">
                            {step.command}
                          </code>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted">
                            {step.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Environment variables</CardTitle>
                  <CardDescription>Names only — no values are shown or logged.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="scrollbar-thin overflow-x-auto">
                    <table className="w-full min-w-[30rem] text-left text-xs">
                      <thead className="border-y border-border bg-background text-muted">
                        <tr>
                          <th className="px-6 py-2.5 font-semibold">Name</th>
                          <th className="px-3 py-2.5 font-semibold">Purpose</th>
                          <th className="px-6 py-2.5 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {envRows.map((row) => (
                          <tr key={row.name}>
                            <td className="whitespace-nowrap px-6 py-2.5 font-mono text-[0.6875rem] text-primary">
                              {row.name}
                            </td>
                            <td className="px-3 py-2.5 text-muted">{row.purpose}</td>
                            <td className="whitespace-nowrap px-6 py-2.5 text-muted">
                              {row.required}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>

        {/* ---------- Honest scope ---------- */}
        <section className="py-16 sm:py-20">
          <Container className="space-y-8">
            <div className="max-w-2xl space-y-3">
              <Badge variant="warning">Deliberately deferred</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                What is not built yet
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Nothing below is presented as complete. Each stage needs your
                approval before work begins.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {deferred.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title}>
                    <CardHeader>
                      <Icon aria-hidden="true" size={19} className="mb-2 text-muted" />
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>{item.body}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="border-t border-border bg-surface">
          <Container className="py-16 sm:py-20">
            <div className="hero-aurora relative overflow-hidden rounded-3xl border border-border bg-background px-6 py-12 text-center sm:px-12">
              <div className="relative mx-auto max-w-2xl space-y-5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles aria-hidden="true" size={22} />
                </span>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your workspace is ready
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                  Open the assistant, try the themes, attachments and settings, and
                  see the real configuration state. Add your provider credentials
                  when you are ready to chat.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/chat" className={cn(buttonVariants({ size: "lg" }))}>
                    Open the assistant <ArrowUpRight aria-hidden="true" size={17} />
                  </Link>
                  <Link
                    href="/#setup"
                    className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                  >
                    Read the setup guide
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
