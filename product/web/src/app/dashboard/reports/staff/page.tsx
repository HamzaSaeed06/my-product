import { apiRequest, ApiError } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCsvButton } from "../export-button";
import { DateRangeFilters } from "../date-range-filters";
import { NoReportAccess } from "../no-access";
import { apiRequestOrEmpty } from "../safe-fetch";

interface NamedOption {
  id: string;
  name: string;
}

interface StaffReport {
  teacherWorkload: { teacherId: string; teacherName: string; sectionsAssigned: number; subjectsTaught: number }[];
  attendance: { teacherId: string; teacherName: string; present: number; absent: number; leave: number; attendancePercentage: number }[];
  leaveStatistics: { teacherId: string; teacherName: string; approvedLeaves: number }[];
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string; campusId?: string }> };

export default async function StaffReportPage(props: Props) {
  try {
    return await StaffReportContent(props);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoReportAccess title="Staff Report" />;
    throw err;
  }
}

async function StaffReportContent({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { dateFrom: rawFrom, dateTo: rawTo, campusId } = await searchParams;
  const dateFrom = rawFrom ?? daysAgoIso(30);
  const dateTo = rawTo ?? todayIso();

  const campuses = await apiRequestOrEmpty<NamedOption>("/api/v1/campuses");

  const query = new URLSearchParams({ dateFrom, dateTo });
  if (campusId) query.set("campusId", campusId);
  const report = await apiRequest<StaffReport>(`/api/v1/reports/staff?${query.toString()}`);

  const canExport = user?.roles.some((r) => ["SUPER_ADMIN", "CAMPUS_HEAD"].includes(r));

  const attendanceByTeacher = new Map(report.attendance.map((a) => [a.teacherId, a]));
  const leaveByTeacher = new Map(report.leaveStatistics.map((l) => [l.teacherId, l]));

  return (
    <div>
      <PageHeader
        title="Staff Report"
        description="Teacher workload, attendance, and approved-leave statistics."
        action={canExport ? <ExportCsvButton category="staff" params={{ dateFrom, dateTo, ...(campusId ? { campusId } : {}) }} /> : undefined}
      />
      <DateRangeFilters basePath="/dashboard/reports/staff" dateFrom={dateFrom} dateTo={dateTo} campusId={campusId ?? ""} campuses={campuses} />

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Attendance %</TableHead>
              <TableHead>Approved leaves</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.teacherWorkload.map((t) => (
              <TableRow key={t.teacherId}>
                <TableCell className="font-medium">{t.teacherName}</TableCell>
                <TableCell className="text-muted-foreground">{t.sectionsAssigned}</TableCell>
                <TableCell className="text-muted-foreground">{t.subjectsTaught}</TableCell>
                <TableCell>{attendanceByTeacher.get(t.teacherId)?.attendancePercentage ?? 0}%</TableCell>
                <TableCell className="text-muted-foreground">{leaveByTeacher.get(t.teacherId)?.approvedLeaves ?? 0}</TableCell>
              </TableRow>
            ))}
            {report.teacherWorkload.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No active teachers yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
