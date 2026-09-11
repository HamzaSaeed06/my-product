"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decidePaymentReversal } from "./actions";

export function DecideReversalButtons({ approvalId }: { approvalId: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this reversal?"
        confirmDescription="The payment and its allocation will be marked reversed, and the invoice status recalculated. Nothing is deleted."
        action={() => decidePaymentReversal(approvalId, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this reversal?"
        confirmDescription="The payment stays as-is."
        destructive
        action={() => decidePaymentReversal(approvalId, "REJECTED")}
      />
    </div>
  );
}
