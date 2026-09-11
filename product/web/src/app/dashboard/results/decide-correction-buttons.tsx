"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideResultCorrection } from "./actions";

export function DecideResultCorrectionButtons({ approvalId }: { approvalId: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this correction?"
        confirmDescription="The locked result item will be updated to the requested value."
        action={() => decideResultCorrection(approvalId, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this correction?"
        confirmDescription="The result item will keep its current value."
        destructive
        action={() => decideResultCorrection(approvalId, "REJECTED")}
      />
    </div>
  );
}
