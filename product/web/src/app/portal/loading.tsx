import { Skeleton } from "@/components/ui/skeleton";

// Portal is mobile-first/glanceable (see DESIGN.md's Layout Density), so its
// loading shape is a simple single-column stack, not the dashboard's table
// skeleton. This matters most here: a parent checking in briefly on a slow
// mobile connection previously got a blank screen with no feedback at all.
export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-1/2" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
