import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatEntry {
  label: string;
  value: string | number;
  icon: LucideIcon;
  deltaPercent?: number | null;
  tone?: "neutral" | "signal";
}

// A single bordered strip divided by hairlines, not four identical
// drop-shadow cards — reads as one ledger header ("here are today's
// figures, side by side") rather than a repeated SaaS KPI-card template.
// No colored border stripes: tone is carried by the number/icon color only.
export function StatStrip({ entries }: { entries: StatEntry[] }) {
  return (
    <div className="grid grid-cols-2 divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {entries.map((entry) => (
        <div key={entry.label} className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{entry.label}</span>
            <entry.icon className={cn("size-4", entry.tone === "signal" ? "text-signal" : "text-muted-foreground")} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{entry.value}</span>
            {entry.deltaPercent != null ? (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums",
                  entry.deltaPercent >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {entry.deltaPercent >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(entry.deltaPercent)}%
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
