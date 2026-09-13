import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatEntry {
  label: string;
  value: string | number;
  deltaPercent?: number | null;
  tone?: "neutral" | "signal";
}

// A single bordered strip divided by hairlines, not four identical
// drop-shadow icon-cards — reads as one ledger header ("here are today's
// figures, side by side") the way Vercel's own usage/summary rows do: plain
// label, plain number, no icon competing with the figure for attention.
export function StatStrip({ entries }: { entries: StatEntry[] }) {
  return (
    <div className="surface-ring grid grid-cols-2 divide-y divide-border rounded-[var(--card-radius)] bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {entries.map((entry) => (
        <div key={entry.label} className="flex flex-col gap-1.5 p-4">
          <span className={cn("text-xs font-medium", entry.tone === "signal" ? "text-signal-foreground" : "text-muted-foreground")}>
            {entry.label}
          </span>
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
