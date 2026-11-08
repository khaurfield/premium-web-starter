import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="flex min-h-dvh flex-col justify-center gap-4 py-16">
      <div className="h-3 w-28 animate-pulse rounded-full bg-border" />
      <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-border" />
      <div className="h-10 w-3/4 max-w-lg animate-pulse rounded-xl bg-border" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-card border border-border bg-surface"
          />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </Container>
  );
}
