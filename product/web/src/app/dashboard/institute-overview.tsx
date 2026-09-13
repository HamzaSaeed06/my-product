import Link from "next/link";
import { Building2, GraduationCap, Users, ClipboardList } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { CampusComparisonChart } from "./campus-comparison-chart";
import { CampusesTable } from "./campuses-table";

interface CampusOverview {
  id: string;
  name: string;
  students: number;
  teachers: number;
  sections: number;
  pendingAdmissions: number;
}

interface InstituteOverviewData {
  totals: {
    campuses: number;
    students: number;
    studentsDeltaPct: number | null;
    teachers: number;
    teachersDeltaPct: number | null;
    pendingAdmissions: number;
  };
  perCampus: CampusOverview[];
}

// Super Admin's home — a read-only, cross-campus monitoring view, not an
// operational tool. Per docs/PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md Phase
// A: once campuses have real Campus Heads, Super Admin's day-to-day job is
// oversight, not data entry — this page is that oversight surface. Every
// number here is a real Prisma count from GET /reports/institute-overview
// (deltas included — see that endpoint's deltaPct(), computed from real
// createdAt history, never invented), so it stays fast and honest as the
// institute grows.
export async function InstituteOverview() {
  const data = await apiRequest<InstituteOverviewData>("/api/v1/reports/institute-overview");
  const { totals, perCampus } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Campuses" value={totals.campuses} icon={Building2} />
        <StatCard label="Students" value={totals.students} icon={GraduationCap} deltaPercent={totals.studentsDeltaPct} />
        <StatCard label="Teachers" value={totals.teachers} icon={Users} deltaPercent={totals.teachersDeltaPct} />
        <StatCard label="Pending admissions" value={totals.pendingAdmissions} icon={ClipboardList} />
      </div>

      {perCampus.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No campuses yet</CardTitle>
            <CardDescription>
              Create your first campus to start seeing per-campus numbers here.{" "}
              <Link href="/dashboard/campuses" className="text-primary underline underline-offset-2">
                Go to Campuses
              </Link>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <CampusComparisonChart perCampus={perCampus} />

          <Card>
            <CardHeader>
              <CardTitle>Campuses</CardTitle>
              <CardDescription>Each campus&apos;s own numbers — click through to drill into one.</CardDescription>
            </CardHeader>
            <CardContent>
              <CampusesTable perCampus={perCampus} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
