import { apiRequest } from "@/lib/apiClient";
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
  const [refunds, payments, students] = await Promise.all([
    apiRequest<Refund[]>("/api/v1/refunds"),
    apiRequest<Payment[]>("/api/v1/payments"),
    apiRequest<Student[]>("/api/v1/students"),
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
        action={<CreateRefundDialog payments={paymentOptions} />}
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
                    {r.status === "PENDING" ? <DecideRefundButtons id={r.id} /> : null}
                    {r.status === "APPROVED" ? <CompleteRefundButton id={r.id} /> : null}
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
