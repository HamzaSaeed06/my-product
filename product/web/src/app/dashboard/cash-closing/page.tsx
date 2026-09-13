import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateCashClosingDialog } from "./create-dialog";
import { ApproveCashClosingButton } from "./approve-button";

interface Campus {
  id: string;
  name: string;
  archivedAt: string | null;
}

interface CashClosing {
  id: string;
  date: string;
  openingBalance: string;
  collections: string;
  actualBalance: string;
  variance: string;
  status: "PENDING" | "APPROVED";
  closedBy: { fullName: string };
  campusId: string;
}

export default async function CashClosingPage() {
  // Mirrors cash_closing.create/cash_closing.approve from routes.ts.
  // campuses is dual-purpose (feeds CreateCashClosingDialog's picker AND
  // campusById's table labels), so gating its fetch on canCreate degrades
  // to the table's existing "—" fallback for a view-only viewer.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("cash_closing.create");
  const canApprove = permissions.includes("cash_closing.approve");

  const [closings, campuses] = await Promise.all([
    apiRequest<CashClosing[]>("/api/v1/cash-closing"),
    canCreate ? apiRequest<Campus[]>("/api/v1/campuses") : Promise.resolve<Campus[]>([]),
  ]);

  const activeCampuses = campuses.filter((c) => !c.archivedAt);
  const campusById = new Map(campuses.map((c) => [c.id, c]));

  return (
    <div>
      <PageHeader
        title="Cash Closing"
        description="Daily reconciliation per campus — expected vs actual, with variance requiring approval."
        action={canCreate ? <CreateCashClosingDialog campuses={activeCampuses} /> : undefined}
      />

      {closings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cash closings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Closed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closings.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">{c.date.slice(0, 10)}</TableCell>
                  <TableCell className="font-medium">{campusById.get(c.campusId)?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.collections}</TableCell>
                  <TableCell className={Number(c.variance) !== 0 ? "text-destructive" : "text-muted-foreground"}>
                    {c.variance}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.closedBy.fullName}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "APPROVED" ? "default" : "secondary"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{canApprove && c.status === "PENDING" ? <ApproveCashClosingButton id={c.id} /> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
