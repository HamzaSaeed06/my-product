import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateRefundDialog } from "./create-dialog";
import { DecideRefundButtons, CompleteRefundButton } from "./action-buttons";

interface Payment {
  id: string;
  paymentNumber: string;
  studentId: string;
  amount: string;
  status: "SUCCESS" | "REVERSED";
}
interface Student {
  id: string;
  fullName: string;
}

interface Refund {
  id: string;
  refundNumber: string;
  amount: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  payment: { paymentNumber: string };
}

const STATUS_VARIANT: Record<Refund["status"], "default" | "secondary"> = {
  PENDING: "secondary",
  APPROVED: "secondary",
  REJECTED: "secondary",
  COMPLETED: "default",
};

export default async function RefundsPage() {
  // Mirrors refund.create/refund.approve from routes.ts. payments/students
  // here are fetched only to build CreateRefundDialog's picker (the table
  // itself reads payment.paymentNumber off the refund relation, not from
  // this array), so both are gated the same way as the dialog.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("refund.create");
  const canApprove = permissions.includes("refund.approve");

  const [refunds, payments, students] = await Promise.all([
    apiRequest<Refund[]>("/api/v1/refunds"),
    canCreate ? apiRequest<Payment[]>("/api/v1/payments") : Promise.resolve<Payment[]>([]),
    canCreate ? apiRequest<Student[]>("/api/v1/students") : Promise.resolve<Student[]>([]),
  ]);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const paymentOptions = payments
    .filter((p) => p.status === "SUCCESS")
    .map((p) => ({ id: p.id, label: `${p.paymentNumber} · ${studentById.get(p.studentId)?.fullName ?? "—"} · ${p.amount}` }));

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Request a refund against a payment, then approve and mark it completed."
        action={canCreate ? <CreateRefundDialog payments={paymentOptions} /> : undefined}
      />

      {refunds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No refunds yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund #</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.refundNumber}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.payment.paymentNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{r.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canApprove && r.status === "PENDING" ? <DecideRefundButtons id={r.id} /> : null}
                    {canApprove && r.status === "APPROVED" ? <CompleteRefundButton id={r.id} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
