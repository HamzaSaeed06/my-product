import { Skeleton } from "@/components/ui/skeleton";

// Generic loading fallback for every /dashboard route — most pages here are
// "header + table", so this shape covers the common case without needing a
// bespoke skeleton per route. Suspense/loading.tsx swaps this in while the
// route's async server fetch is in flight, instead of the previous blank
// screen.
export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="border-b border-border bg-muted/40 p-2">
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="ml-auto h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
