"use client";

import { Button } from "@/components/ui/button";
import { getStudentById } from "@/lib/mock/students";
import type { Payment, PaymentReversalRequest } from "@/lib/mock/payments";

export function PendingReversals({
  requests,
  payments,
  onDecide,
}: {
  requests: PaymentReversalRequest[];
  payments: Payment[];
  onDecide: (requestId: string, approve: boolean) => void;
}) {
  if (requests.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="label-eyebrow text-muted-foreground">Pending reversal requests</span>
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {requests.map((request) => {
          const payment = payments.find((p) => p.id === request.paymentId);
          const student = payment ? getStudentById(payment.studentId) : null;
          return (
            <div key={request.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground">
                  <strong className="font-medium">{payment?.paymentNumber}</strong> — {student?.fullName} — Rs {payment?.amount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">{request.reason}</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => onDecide(request.id, false)}>Reject</Button>
                <Button size="sm" onClick={() => onDecide(request.id, true)}>Approve</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
