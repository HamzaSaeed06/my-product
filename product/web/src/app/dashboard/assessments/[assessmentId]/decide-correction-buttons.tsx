"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideMarksCorrection } from "./actions";

export function DecideMarksCorrectionButtons({ assessmentId, approvalId }: { assessmentId: string; approvalId: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this correction?"
        confirmDescription="The locked marks will be updated to the requested value."
        action={() => decideMarksCorrection(assessmentId, approvalId, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this correction?"
        confirmDescription="The marks will keep their current value."
        destructive
        action={() => decideMarksCorrection(assessmentId, approvalId, "REJECTED")}
      />
    </div>
  );
}
