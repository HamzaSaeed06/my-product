"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideLeave, cancelLeave } from "./actions";

export function LeaveActionButtons({ id, status }: { id: string; status: string }) {
  if (status === "PENDING") {
    return (
      <div className="flex justify-end gap-2">
        <ConfirmActionButton
          label="Approve"
          confirmTitle="Approve this leave request?"
          confirmDescription="If it's a student leave, future attendance marked ABSENT on a covered date will auto-record as LEAVE instead."
          action={() => decideLeave(id, "APPROVED")}
        />
        <ConfirmActionButton
          label="Reject"
          confirmTitle="Reject this leave request?"
          confirmDescription=""
          destructive
          action={() => decideLeave(id, "REJECTED")}
        />
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex justify-end">
        <ConfirmActionButton
          label="Cancel"
          confirmTitle="Cancel this approved leave?"
          confirmDescription=""
          destructive
          action={() => cancelLeave(id)}
        />
      </div>
    );
  }

  return null;
}
