import { StatusDot } from "@/components/status-dot";
import type { CampusOverview } from "@/lib/mock/campuses";

// Super Admin's stated job is oversight, not data entry: "spot the one
// that's behind." A full comparison table (below) answers "how does every
// campus compare"; this panel answers a different, narrower question —
// "which campus needs me right now" — ranked, not alphabetical, and
// deliberately compact. Two distinct components for two distinct questions,
// not one table trying to serve both.
//
// Each ranked campus is its own small card (a gallery, not one wrapping
// card with an internal divided list) — with only 2-4 entries this reads
// as a set of individually-scannable items rather than a single dense block.
export function NeedsAttentionPanel({ campuses }: { campuses: CampusOverview[] }) {
  const ranked = [...campuses]
    .map((c) => ({ campus: c, score: (100 - c.feeCollectedPct) + c.pendingAdmissions }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="flex h-fit flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
        <p className="text-xs text-muted-foreground">Ranked by fee shortfall and pending admissions.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {ranked.map(({ campus }, i) => (
          <div key={campus.id} className="surface-ring flex flex-col gap-2 rounded-lg bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{campus.name}</span>
              <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
            </div>
            <StatusDot tone={campus.feeCollectedPct < 85 ? "danger" : "warning"}>
              <span className="font-mono tabular-nums">{campus.feeCollectedPct}%</span>&nbsp;fees collected
            </StatusDot>
            {campus.pendingAdmissions > 0 ? (
              <span className="font-mono text-xs tabular-nums text-signal-foreground">
                {campus.pendingAdmissions} pending admissions
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
