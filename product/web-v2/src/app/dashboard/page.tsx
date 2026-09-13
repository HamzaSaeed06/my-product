import { StatStrip, type StatEntry } from "@/components/stat-tile";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CampusEnrollmentChart } from "./campus-enrollment-chart";
import { CampusesOverviewTable } from "./campuses-overview-table";
import { NeedsAttentionPanel } from "./needs-attention-panel";
import { mockCampuses, mockTotals, mockEnrollmentTrend } from "@/lib/mock/campuses";

// Super Admin's home is a read-only, cross-campus monitoring view, not a
// data-entry surface — per this codebase's own stated intent (see
// product/web's institute-overview.tsx). The layout below is built for that
// specific job, not a generic "stack of cards" dashboard: a trend chart
// (how are we tracking over time) sits beside a ranked attention panel (who
// needs me right now) — two different questions, two different components,
// side by side — and the full comparison table underneath answers a third,
// separate question (how does every campus stack up against every other).
const STAT_ENTRIES: StatEntry[] = [
  { label: "Campuses", value: mockTotals.campuses },
  { label: "Students", value: mockTotals.students.toLocaleString(), deltaPercent: mockTotals.studentsDeltaPct },
  { label: "Teachers", value: mockTotals.teachers, deltaPercent: mockTotals.teachersDeltaPct },
  { label: "Pending admissions", value: mockTotals.pendingAdmissions, tone: "signal" },
];

export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Institute overview" description="Cross-campus monitoring — mock data, Phase A/B demo." />

      <StatStrip entries={STAT_ENTRIES} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CampusEnrollmentChart data={mockEnrollmentTrend} />
        </div>
        <NeedsAttentionPanel campuses={mockCampuses} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All campuses</CardTitle>
          <CardDescription>Full comparison — click through to drill into one.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-2">
          <CampusesOverviewTable campuses={mockCampuses} />
        </CardContent>
      </Card>
    </div>
  );
}
