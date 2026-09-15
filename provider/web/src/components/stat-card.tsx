import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// The KPI-tile shape for this app, matching the sibling product/web app's
// stat-card.tsx (same Card primitive, same rounded-xl/ring-1/tabular-nums
// treatment) instead of the previously hand-rolled `rounded-lg border p-4`
// divs on the dashboard home.
export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </CardTitle>
        {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
      </CardHeader>
    </Card>
  );
}
