import { Skeleton } from "@/components/ui/skeleton";

// Shaped like the table it's replacing, not a spinner covering the screen —
// this matters most on exactly this kind of data-dense list screen.
export default function StudentsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex border-b border-border bg-muted/40 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mr-6 h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-border p-3 last:border-0">
            {Array.from({ length: 6 }).map((__, j) => (
              <Skeleton key={j} className="mr-6 h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
