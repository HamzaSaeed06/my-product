import { apiRequest, ApiError } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCsvButton } from "../export-button";
import { DateRangeFilters } from "../date-range-filters";
import { LineChartCard } from "../charts";
import { NoReportAccess } from "../no-access";
import { apiRequestOrEmpty } from "../safe-fetch";

interface NamedOption {
  id: string;
  name: string;
}

interface AdmissionReport {
  applicationsReceived: number;
  approvedRejected: { pending: number; approved: number; rejected: number; withdrawn: number };
  enrollmentTrends: { month: string; count: number }[];
  classCapacity: { sectionId: string; sectionName: string; capacity: number | null; enrolled: number; utilizationPercentage: number | null }[];
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string; campusId?: string }> };

export default async function AdmissionReportPage(props: Props) {
  try {
    return await AdmissionReportContent(props);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoReportAccess title="Admission Report" />;
    throw err;
  }
}

async function AdmissionReportContent({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { dateFrom: rawFrom, dateTo: rawTo, campusId } = await searchParams;
  const dateFrom = rawFrom ?? daysAgoIso(90);
  const dateTo = rawTo ?? todayIso();

  const campuses = await apiRequestOrEmpty<NamedOption>("/api/v1/campuses");

  const query = new URLSearchParams({ dateFrom, dateTo });
  if (campusId) query.set("campusId", campusId);
  const report = await apiRequest<AdmissionReport>(`/api/v1/reports/admissions?${query.toString()}`);

  const canExport = user?.roles.some((r) => ["SUPER_ADMIN", "CAMPUS_HEAD", "OFFICE"].includes(r));

  return (
    <div>
      <PageHeader
        title="Admission Report"
        description="Applications received, approval status, enrollment trends, class capacity."
        action={canExport ? <ExportCsvButton category="admissions" params={{ dateFrom, dateTo, ...(campusId ? { campusId } : {}) }} /> : undefined}
      />
      <DateRangeFilters basePath="/dashboard/reports/admissions" dateFrom={dateFrom} dateTo={dateTo} campusId={campusId ?? ""} campuses={campuses} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Applications received</p>
          <p className="text-2xl font-semibold text-foreground">{report.applicationsReceived}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="text-2xl font-semibold text-foreground">{report.approvedRejected.approved}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Rejected</p>
          <p className="text-2xl font-semibold text-foreground">{report.approvedRejected.rejected}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-semibold text-foreground">{report.approvedRejected.pending}</p>
        </div>
      </div>

      <div className="mt-6">
        <LineChartCard title="Enrollment trend" data={report.enrollmentTrends.map((t) => ({ label: t.month, value: t.count }))} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Class capacity</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.classCapacity.map((c) => (
                <TableRow key={c.sectionId}>
                  <TableCell className="font-medium">{c.sectionName}</TableCell>
                  <TableCell className="text-muted-foreground">{c.enrolled}</TableCell>
                  <TableCell className="text-muted-foreground">{c.capacity ?? "—"}</TableCell>
                  <TableCell>{c.utilizationPercentage !== null ? `${c.utilizationPercentage}%` : "—"}</TableCell>
                </TableRow>
              ))}
              {report.classCapacity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No sections yet.
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
