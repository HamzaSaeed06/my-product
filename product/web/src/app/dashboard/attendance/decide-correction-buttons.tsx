"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideAttendanceCorrection } from "./actions";

export function DecideCorrectionButtons({ approvalId }: { approvalId: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this correction?"
        confirmDescription="The attendance record will be updated to the requested status."
        action={() => decideAttendanceCorrection(approvalId, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this correction?"
        confirmDescription="The attendance record will keep its current status."
        destructive
        action={() => decideAttendanceCorrection(approvalId, "REJECTED")}
      />
    </div>
  );
}
