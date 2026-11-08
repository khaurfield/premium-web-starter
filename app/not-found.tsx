import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <Container className="flex min-h-dvh flex-col items-start justify-center gap-5 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-xl text-base leading-relaxed text-muted">
        The route you requested does not exist. Available pages are the home
        page and <code>/chat</code>; the API lives under <code>/api</code>.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Back to home
      </Link>
    </Container>
  );
}
