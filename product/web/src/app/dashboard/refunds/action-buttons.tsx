"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideRefund, completeRefund } from "./actions";

export function DecideRefundButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this refund?"
        confirmDescription="Marks it ready to be paid out."
        action={() => decideRefund(id, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this refund?"
        confirmDescription=""
        destructive
        action={() => decideRefund(id, "REJECTED")}
      />
    </div>
  );
}

export function CompleteRefundButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Mark completed"
      confirmTitle="Mark this refund as completed?"
      confirmDescription="Confirms the money was actually paid out to the student/parent."
      action={() => completeRefund(id)}
    />
  );
}
