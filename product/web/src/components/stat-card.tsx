import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { DeltaBadge } from "@/components/delta-badge";

// The one KPI-tile shape for the whole app. Previously reimplemented three
// different ways (Institute Overview's shadcn Card vs. each Reports page's
// hand-rolled `rounded-lg border p-4` div) with different radius, edge
// treatment, and grid gap — see docs' critique log. Every page showing a
// single number as a headline stat should use this instead of a bespoke div.
export function StatCard({
  label,
  value,
  icon: Icon,
  deltaPercent,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Omit entirely when there's no honest baseline to compare against —
   * DeltaBadge renders a neutral "New" pill, never a fabricated percentage. */
  deltaPercent?: number | null;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          {Icon ? <Icon className="size-3.5" /> : null}
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </CardTitle>
        {deltaPercent !== undefined ? (
          <CardAction>
            <DeltaBadge percent={deltaPercent} />
          </CardAction>
        ) : null}
      </CardHeader>
    </Card>
  );
}
