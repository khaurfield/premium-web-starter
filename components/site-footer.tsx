import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { APP_VERSION } from "@/lib/app-info";

const REPOSITORY_URL = "https://github.com/khaurfield/premium-web-starter";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col gap-5 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="text-sm font-semibold">Personal AI Assistant</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            MIT licensed · v{APP_VERSION} · Next.js 16, React 19, strict
            TypeScript and Tailwind CSS 4. Conversation history stays in your
            browser; provider keys stay on the server.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-muted sm:items-end">
          <Link href="/chat" className="text-primary hover:underline">
            Open the assistant
          </Link>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Source on GitHub <ExternalLink aria-hidden="true" size={11} />
          </a>
          <p>Auth, cloud sync, RAG and Android are later stages.</p>
        </div>
      </Container>
    </footer>
  );
}
