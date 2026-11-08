import { ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const REPOSITORY_URL = "https://github.com/khaurfield/premium-web-starter";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Setup", href: "/#setup" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-3">
        <Brand />

        <nav
          aria-label="Main navigation"
          className="ml-4 hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            GitHub <ExternalLink aria-hidden="true" size={13} />
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/chat"
            className={cn(buttonVariants({ size: "sm" }), "h-10 px-3 sm:px-4")}
          >
            <span className="hidden sm:inline">Open assistant</span>
            <span className="sm:hidden">Open app</span>
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </Container>
    </header>
  );
}
