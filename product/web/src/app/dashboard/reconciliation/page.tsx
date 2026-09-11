import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangeFilter } from "./date-range-filter";

interface ReconciliationSummary {
  gateway: { count: number; total: number };
  schoolRecords: { count: number; total: number };
  matched: boolean;
  breakdown: { initiated: number; pending: number; failed: number; success: number };
  pendingExceptions: {
    id: string;
    gatewayTxnId: string;
    amount: string;
    status: string;
    createdAt: string;
  }[];
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const { dateFrom: rawFrom, dateTo: rawTo } = await searchParams;
  const dateFrom = rawFrom ?? daysAgoIso(30);
  const dateTo = rawTo ?? todayIso();

  const summary = await apiRequest<ReconciliationSummary>(
    `/api/v1/payment-reconciliation?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Compares what the gateway confirmed as SUCCESS against what was recorded as an ONLINE payment, plus any callback flagged for manual review."
      />
      <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Gateway SUCCESS</p>
          <p className="text-2xl font-semibold text-foreground">{summary.gateway.count}</p>
          <p className="text-xs text-muted-foreground">Total {summary.gateway.total}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Recorded ONLINE payments</p>
          <p className="text-2xl font-semibold text-foreground">{summary.schoolRecords.count}</p>
          <p className="text-xs text-muted-foreground">Total {summary.schoolRecords.total}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Reconciliation status</p>
          <p className="mt-1">
            <Badge variant={summary.matched ? "default" : "destructive"}>{summary.matched ? "Matched" : "Mismatch"}</Badge>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Gateway transaction breakdown</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Initiated {summary.breakdown.initiated}</Badge>
          <Badge variant="secondary">Pending {summary.breakdown.pending}</Badge>
          <Badge variant="secondary">Failed {summary.breakdown.failed}</Badge>
          <Badge variant="default">Success {summary.breakdown.success}</Badge>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Pending exceptions</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          A gateway callback that couldn&apos;t be matched to a known transaction or whose amount didn&apos;t match — never
          auto-applied, flagged here for manual review instead.
        </p>
        {summary.pendingExceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending exceptions.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gateway Txn Id</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.pendingExceptions.map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{ex.gatewayTxnId}</TableCell>
                    <TableCell>{ex.amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ex.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ex.createdAt.slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
