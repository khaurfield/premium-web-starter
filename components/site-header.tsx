import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { publicEnv } from "@/lib/public-env";

const REPOSITORY_URL = "https://github.com/khaurfield/premium-web-starter";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="2" y="13" width="4" height="6" rx="1" />
              <rect x="18" y="13" width="4" height="6" rx="1" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            {publicEnv.appName}
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-3">
          <Badge variant="info">Foundation stage</Badge>
          <a
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
            href="#architecture"
          >
            Architecture
          </a>
          <a
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
            href="#setup"
          >
            Setup
          </a>
          <a
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub <ExternalLink aria-hidden="true" size={14} />
          </a>
        </nav>
      </Container>
    </header>
  );
}
