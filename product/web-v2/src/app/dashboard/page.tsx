import { Building2, GraduationCap, Users, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "@/components/stat-tile";
import { CampusEnrollmentChart } from "./campus-enrollment-chart";
import { CampusesOverviewTable } from "./campuses-overview-table";
import { mockCampuses, mockTotals, mockEnrollmentTrend } from "@/lib/mock/campuses";

// Super Admin's home is a read-only, cross-campus monitoring view, not a
// data-entry surface — per this codebase's own stated intent (see
// product/web's institute-overview.tsx). Once real Campus Heads run each
// campus day-to-day, Super Admin's job here is oversight: compare campuses,
// spot the one that's behind, drill in. It is not where fees get recorded
// or students get created.
export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Institute overview</h1>
        <p className="text-sm text-muted-foreground">Cross-campus monitoring — mock data, Phase A/B demo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Campuses" value={mockTotals.campuses} icon={Building2} accent="ink" />
        <StatTile label="Students" value={mockTotals.students.toLocaleString()} icon={GraduationCap} deltaPercent={mockTotals.studentsDeltaPct} accent="success" />
        <StatTile label="Teachers" value={mockTotals.teachers} icon={Users} deltaPercent={mockTotals.teachersDeltaPct} accent="success" />
        <StatTile label="Pending admissions" value={mockTotals.pendingAdmissions} icon={ClipboardList} accent="signal" />
      </div>

      <CampusEnrollmentChart data={mockEnrollmentTrend} />

      <Card>
        <CardHeader>
          <CardTitle>Campuses</CardTitle>
          <CardDescription>Each campus&apos;s own numbers — click through to drill into one.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-2">
          <CampusesOverviewTable campuses={mockCampuses} />
        </CardContent>
      </Card>
    </div>
  );
}
