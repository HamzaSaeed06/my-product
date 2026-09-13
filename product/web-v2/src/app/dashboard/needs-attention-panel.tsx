import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import type { CampusOverview } from "@/lib/mock/campuses";

// Super Admin's stated job is oversight, not data entry: "spot the one
// that's behind." A full comparison table (below) answers "how does every
// campus compare"; this panel answers a different, narrower question —
// "which campus needs me right now" — ranked, not alphabetical, and
// deliberately compact. Two distinct components for two distinct questions,
// not one table trying to serve both. `h-full` so it matches the enrollment
// chart's height in the 2:1 row they share, rather than shrinking to fit
// its own (shorter) content.
export function NeedsAttentionPanel({ campuses }: { campuses: CampusOverview[] }) {
  const ranked = [...campuses]
    .map((c) => ({ campus: c, score: (100 - c.feeCollectedPct) + c.pendingAdmissions }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Ranked by fee shortfall and pending admissions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {ranked.map(({ campus }) => (
          <div key={campus.id} className="flex flex-col gap-1.5 px-4 py-3 first:pt-0">
            <span className="text-sm font-medium text-foreground">{campus.name}</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <StatusDot tone={campus.feeCollectedPct < 85 ? "danger" : "warning"}>
                <span className="font-mono tabular-nums">{campus.feeCollectedPct}%</span>&nbsp;fees collected
              </StatusDot>
              {campus.pendingAdmissions > 0 ? (
                <span className="font-mono tabular-nums text-signal-foreground">{campus.pendingAdmissions} pending admissions</span>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
