import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Renders nothing when there's no honest baseline to compare against
// (null) rather than a fabricated number — see reports/service.ts's
// deltaPct() for why a null can legitimately happen (e.g. the metric was
// zero 30 days ago).
export function DeltaBadge({ percent, className }: { percent: number | null; className?: string }) {
  if (percent === null) {
    return (
      <span
        className={cn(
          "inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        New
      </span>
    );
  }

  const isPositive = percent >= 0;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium tabular-nums",
        isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
        className
      )}
    >
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isPositive ? "+" : ""}
      {percent}%
    </span>
  );
}
