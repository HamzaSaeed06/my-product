import { apiRequest, ApiError } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { SectionHeading } from "@/components/section-heading";
import { ExportCsvButton } from "../export-button";
import { DateRangeFilters } from "../date-range-filters";
import { BarChartCard } from "../charts";
import { NoReportAccess } from "../no-access";
import { apiRequestOrEmpty } from "../safe-fetch";

interface NamedOption {
  id: string;
  name: string;
}

interface AttendanceReport {
  dailyAttendance: { date: string; present: number; absent: number; leave: number; total: number }[];
  monthlySummary: { totalRecords: number; present: number; absent: number; leave: number; overallAttendancePercentage: number };
  studentWise: { studentId: string; studentName: string; studentCode: string; present: number; absent: number; leave: number; attendancePercentage: number }[];
  classWise: { sectionId: string; present: number; absent: number; leave: number; attendancePercentage: number }[];
  absenceTrends: { date: string; absentCount: number }[];
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string; campusId?: string }> };

export default async function AttendanceReportPage(props: Props) {
  try {
    return await AttendanceReportContent(props);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoReportAccess title="Attendance Report" />;
    throw err;
  }
}

async function AttendanceReportContent({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { dateFrom: rawFrom, dateTo: rawTo, campusId } = await searchParams;
  const dateFrom = rawFrom ?? daysAgoIso(30);
  const dateTo = rawTo ?? todayIso();

  const campuses = await apiRequestOrEmpty<NamedOption>("/api/v1/campuses");

  const query = new URLSearchParams({ dateFrom, dateTo });
  if (campusId) query.set("campusId", campusId);
  const report = await apiRequest<AttendanceReport>(`/api/v1/reports/attendance?${query.toString()}`);

  const canExport = user?.roles.some((r) => ["SUPER_ADMIN", "CAMPUS_HEAD"].includes(r));

  return (
    <div>
      <PageHeader
        title="Attendance Report"
        description="Daily attendance, monthly summary, student-wise and class-wise breakdowns."
        action={canExport ? <ExportCsvButton category="attendance" params={{ dateFrom, dateTo, ...(campusId ? { campusId } : {}) }} /> : undefined}
      />
      <DateRangeFilters basePath="/dashboard/reports/attendance" dateFrom={dateFrom} dateTo={dateTo} campusId={campusId ?? ""} campuses={campuses} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Present" value={report.monthlySummary.present} />
        <StatCard label="Absent" value={report.monthlySummary.absent} />
        <StatCard label="Leave" value={report.monthlySummary.leave} />
        <StatCard label="Overall attendance" value={`${report.monthlySummary.overallAttendancePercentage}%`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard title="Daily attendance (present)" data={report.dailyAttendance.map((d) => ({ label: d.date.slice(5), value: d.present }))} />
        <BarChartCard title="Highest-absence days" data={report.absenceTrends.map((d) => ({ label: d.date.slice(5), value: d.absentCount }))} />
      </div>

      <div className="mt-6">
        <SectionHeading>Student-wise</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Leave</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.studentWise.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell className="font-medium">
                    {s.studentName} <span className="font-mono text-xs text-muted-foreground">({s.studentCode})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.present}</TableCell>
                  <TableCell className="text-muted-foreground">{s.absent}</TableCell>
                  <TableCell className="text-muted-foreground">{s.leave}</TableCell>
                  <TableCell>{s.attendancePercentage}%</TableCell>
                </TableRow>
              ))}
              {report.studentWise.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No attendance records in this range.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
