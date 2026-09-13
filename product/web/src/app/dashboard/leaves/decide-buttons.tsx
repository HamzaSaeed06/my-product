"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideLeave, cancelLeave } from "./actions";

interface LeaveActionButtonsProps {
  id: string;
  status: string;
  // Mirrors leave.approve/leave.reject/leave.cancel from routes.ts — every
  // dashboard-shell role that can even see this page has approve+reject
  // today, but none currently hold leave.cancel (only Teacher/Parent do,
  // and they never reach this page), so Cancel must not render as a false
  // affordance that always 403s.
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
}

export function LeaveActionButtons({ id, status, canApprove, canReject, canCancel }: LeaveActionButtonsProps) {
  if (status === "PENDING") {
    if (!canApprove && !canReject) return null;
    return (
      <div className="flex justify-end gap-2">
        {canApprove ? (
          <ConfirmActionButton
            label="Approve"
            confirmTitle="Approve this leave request?"
            confirmDescription="If it's a student leave, future attendance marked ABSENT on a covered date will auto-record as LEAVE instead."
            action={() => decideLeave(id, "APPROVED")}
          />
        ) : null}
        {canReject ? (
          <ConfirmActionButton
            label="Reject"
            confirmTitle="Reject this leave request?"
            confirmDescription=""
            destructive
            action={() => decideLeave(id, "REJECTED")}
          />
        ) : null}
      </div>
    );
  }

  if (status === "APPROVED") {
    if (!canCancel) return null;
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
