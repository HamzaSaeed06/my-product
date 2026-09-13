import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  deltaPercent?: number | null;
  accent?: "ink" | "signal" | "success" | "danger";
}

const ACCENT_BORDER: Record<NonNullable<StatTileProps["accent"]>, string> = {
  ink: "border-l-primary",
  signal: "border-l-signal",
  success: "border-l-success",
  danger: "border-l-destructive",
};

export function StatTile({ label, value, icon: Icon, deltaPercent, accent = "ink" }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border border-border border-l-[3px] bg-card p-4", ACCENT_BORDER[accent])}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        {deltaPercent != null ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              deltaPercent >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {deltaPercent >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(deltaPercent)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
