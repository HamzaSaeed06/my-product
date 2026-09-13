import { apiRequest, ApiError } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExportCsvButton } from "../export-button";
import { DateRangeFilters } from "../date-range-filters";
import { LineChartCard } from "../charts";
import { NoReportAccess } from "../no-access";
import { apiRequestOrEmpty } from "../safe-fetch";

interface NamedOption {
  id: string;
  name: string;
}

interface FinancialReport {
  dailyCollection: { date: string; total: number }[];
  monthlyCollection: { month: string; total: number }[];
  outstandingFees: number;
  paidInvoicesCount: number;
  discountWaiverSummary: { totalDiscounts: number; discountCount: number; totalWaivers: number; waiverCount: number };
  campusWiseRevenue: { campusId: string; total: number }[];
  cashierReports: { id: string; campusId: string; date: string; collections: number; variance: number; status: string }[];
  reconciliation: { pendingCount: number; pendingTotal: number };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = { searchParams: Promise<{ dateFrom?: string; dateTo?: string; campusId?: string }> };

export default async function FinancialReportPage(props: Props) {
  try {
    return await FinancialReportContent(props);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoReportAccess title="Financial Report" />;
    throw err;
  }
}

async function FinancialReportContent({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { dateFrom: rawFrom, dateTo: rawTo, campusId } = await searchParams;
  const dateFrom = rawFrom ?? daysAgoIso(30);
  const dateTo = rawTo ?? todayIso();

  const campuses = await apiRequestOrEmpty<NamedOption>("/api/v1/campuses");
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));

  const query = new URLSearchParams({ dateFrom, dateTo });
  if (campusId) query.set("campusId", campusId);
  const report = await apiRequest<FinancialReport>(`/api/v1/reports/financial?${query.toString()}`);

  const canExport = user?.roles.some((r) => ["SUPER_ADMIN", "CAMPUS_HEAD", "OFFICE"].includes(r));

  return (
    <div>
      <PageHeader
        title="Financial Report"
        description="Collection trends, outstanding fees, discounts/waivers, cashier reports, reconciliation."
        action={canExport ? <ExportCsvButton category="financial" params={{ dateFrom, dateTo, ...(campusId ? { campusId } : {}) }} /> : undefined}
      />
      <DateRangeFilters basePath="/dashboard/reports/financial" dateFrom={dateFrom} dateTo={dateTo} campusId={campusId ?? ""} campuses={campuses} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Outstanding fees</p>
          <p className="text-2xl font-semibold text-foreground">{report.outstandingFees}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Paid invoices (range)</p>
          <p className="text-2xl font-semibold text-foreground">{report.paidInvoicesCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Pending reconciliation</p>
          <p className="text-2xl font-semibold text-foreground">{report.reconciliation.pendingCount}</p>
        </div>
      </div>

      <div className="mt-6">
        <LineChartCard title="Daily collection" data={report.dailyCollection.map((d) => ({ label: d.date.slice(5), value: d.total }))} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium text-foreground">Discounts &amp; waivers</p>
          <p className="text-sm text-muted-foreground">
            {report.discountWaiverSummary.discountCount} discounts totaling {report.discountWaiverSummary.totalDiscounts}
          </p>
          <p className="text-sm text-muted-foreground">
            {report.discountWaiverSummary.waiverCount} waivers totaling {report.discountWaiverSummary.totalWaivers}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium text-foreground">Campus-wise revenue</p>
          {report.campusWiseRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collections in this range.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {report.campusWiseRevenue.map((c) => (
                <p key={c.campusId} className="text-sm text-muted-foreground">
                  {campusNameById.get(c.campusId) ?? "Unassigned"}: {c.total}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Cashier reports (Cash Closings)</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.cashierReports.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">{c.date.slice(0, 10)}</TableCell>
                  <TableCell>{c.collections}</TableCell>
                  <TableCell className={c.variance !== 0 ? "text-destructive" : "text-muted-foreground"}>{c.variance}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "APPROVED" ? "default" : "secondary"}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {report.cashierReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No cash closings in this range.
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
