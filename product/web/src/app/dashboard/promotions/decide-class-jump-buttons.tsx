"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decidePromotionClassJump } from "./actions";

export function DecideClassJumpButtons({ approvalId }: { approvalId: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this class jump?"
        confirmDescription="Creates the new enrollment in the target class/section immediately."
        action={() => decidePromotionClassJump(approvalId, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this class jump?"
        confirmDescription="The student will not be promoted via this decision."
        destructive
        action={() => decidePromotionClassJump(approvalId, "REJECTED")}
      />
    </div>
  );
}
