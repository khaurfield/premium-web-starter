import { Container } from "@/components/ui/container";
import { APP_VERSION } from "@/lib/app-info";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          MIT licensed · v{APP_VERSION} · Built with Next.js, TypeScript and
          Tailwind CSS.
        </p>
        <p>
          Chat UI, authentication, RAG, Capacitor and on-device models are
          planned for later stages.
        </p>
      </Container>
    </footer>
  );
}
