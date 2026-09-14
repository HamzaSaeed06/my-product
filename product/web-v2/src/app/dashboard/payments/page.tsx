"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockPayments, mockReversalRequests, type Payment, type PaymentReversalRequest } from "@/lib/mock/payments";
import { getPaymentColumns } from "./columns";
import { RecordPaymentSheet } from "./record-sheet";
import { RequestReversalDialog } from "./reversal-dialog";
import { PendingReversals } from "./pending-reversals";

export default function PaymentsPage() {
  const [recordOpen, setRecordOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [requests, setRequests] = useState<PaymentReversalRequest[]>(mockReversalRequests);
  const [reversalTarget, setReversalTarget] = useState<Payment | null>(null);

  function requestReversal(reason: string) {
    if (!reversalTarget) return;
    setRequests((prev) => [
      ...prev,
      { id: `prr_${Date.now()}`, paymentId: reversalTarget.id, reason, status: "PENDING", requestedById: "usr_office_1", requestedAt: new Date().toISOString(), decidedById: null, decidedAt: null },
    ]);
    toast.success("Reversal request sent for approval.");
  }

  function decideReversal(requestId: string, approve: boolean) {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: approve ? "APPROVED" : "REJECTED", decidedById: "usr_head_main", decidedAt: new Date().toISOString() } : r)));
    if (approve) {
      setPayments((prev) => prev.map((p) => (p.id === request.paymentId ? { ...p, status: "REVERSED", reversedById: "usr_head_main", reversedAt: new Date().toISOString(), reversalReason: request.reason } : p)));
    }
    toast.success(approve ? "Payment reversed." : "Reversal request rejected.");
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        description="Money received against one or more invoices. Reversing one goes through a request-then-approve step, never a direct edit."
        actions={
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="size-3.5" />
            Record payment
          </Button>
        }
      />
      <DataTable
        columns={getPaymentColumns((paymentId) => pendingRequests.some((r) => r.paymentId === paymentId), setReversalTarget)}
        data={payments}
        emptyTitle="No payments recorded yet"
        emptyDescription="Record one against a student's invoice."
      />
      <PendingReversals requests={pendingRequests} payments={payments} onDecide={decideReversal} />

      <RecordPaymentSheet open={recordOpen} onOpenChange={setRecordOpen} />
      <RequestReversalDialog payment={reversalTarget} onOpenChange={(open) => !open && setReversalTarget(null)} onSubmit={requestReversal} />
    </div>
  );
}
