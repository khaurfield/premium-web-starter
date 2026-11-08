import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <aside className="hidden w-[17.5rem] shrink-0 flex-col gap-3 border-r border-border bg-sidebar p-4 lg:flex">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="ml-auto h-9 w-32" />
        </div>
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-xl space-y-4">
            <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
            <Skeleton className="mx-auto h-8 w-3/4" />
            <Skeleton className="mx-auto h-4 w-full" />
            <Skeleton className="mx-auto h-4 w-2/3" />
          </div>
        </div>
        <div className="border-t border-border p-4">
          <Skeleton className="mx-auto h-24 w-full max-w-3xl rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">Loading the assistant workspace</span>
    </div>
  );
}
