import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RecordPaymentDialog } from "./record-dialog";
import { RequestReversalDialog } from "./reversal-dialog";
import { DecideReversalButtons } from "./decide-reversal-buttons";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
  status: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
}

interface Invoice {
  id: string;
  studentId: string;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
}

interface CreditTransaction {
  id: string;
  studentId: string;
  transactionNumber: string;
  amount: string;
  status: string;
}

interface Payment {
  id: string;
  paymentNumber: string;
  studentId: string;
  amount: string;
  method: "CASH" | "ONLINE";
  status: "SUCCESS" | "REVERSED";
  receipt: { receiptNumber: string } | null;
}

interface ApprovalRequest {
  id: string;
  type: string;
  payload: { paymentId: string; reason: string };
  requestedBy: { fullName: string };
}

export default async function PaymentsPage() {
  // Mirrors payment.record/payment.reverse from routes.ts. students is
  // dual-purpose (feeds RecordPaymentDialog's picker AND studentById's
  // table labels), so gating its fetch on canRecord degrades to the
  // table's existing "—" fallback for a view-only viewer rather than
  // fetching data nobody but the Create dialog needs. invoices/credits are
  // fetched only to feed that same dialog.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canRecord = permissions.includes("payment.record");
  const canReverse = permissions.includes("payment.reverse");

  const [students, invoices, credits, payments, pendingApprovals] = await Promise.all([
    canRecord ? apiRequest<Student[]>("/api/v1/students") : Promise.resolve<Student[]>([]),
    canRecord ? apiRequest<Invoice[]>("/api/v1/invoices") : Promise.resolve<Invoice[]>([]),
    canRecord ? apiRequest<CreditTransaction[]>("/api/v1/payments/credits") : Promise.resolve<CreditTransaction[]>([]),
    apiRequest<Payment[]>("/api/v1/payments"),
    apiRequest<ApprovalRequest[]>("/api/v1/approvals?status=PENDING"),
  ]);

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const studentById = new Map(students.map((s) => [s.id, s]));
  const reversalApprovals = pendingApprovals.filter((a) => a.type === "PAYMENT_REVERSAL");

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Record a cash payment against an invoice, or request/approve a reversal."
        action={canRecord ? <RecordPaymentDialog students={activeStudents} invoices={invoices} credits={credits} /> : undefined}
      />

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.paymentNumber}</TableCell>
                  <TableCell className="font-medium">{studentById.get(p.studentId)?.fullName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{p.method}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.receipt?.receiptNumber ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "SUCCESS" ? "default" : "secondary"}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canReverse && p.status === "SUCCESS" ? <RequestReversalDialog paymentId={p.id} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {reversalApprovals.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Pending payment reversals</h2>
          <div className="flex flex-col gap-3">
            {reversalApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <p className="text-sm text-muted-foreground">
                  Requested by {approval.requestedBy.fullName}: &ldquo;{approval.payload.reason}&rdquo;
                </p>
                {canReverse ? <DecideReversalButtons approvalId={approval.id} /> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
