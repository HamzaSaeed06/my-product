"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideWaiver } from "./actions";

export function DecideWaiverButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this waiver?"
        confirmDescription="The invoice's remaining balance is reduced immediately."
        action={() => decideWaiver(id, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this waiver?"
        confirmDescription=""
        destructive
        action={() => decideWaiver(id, "REJECTED")}
      />
    </div>
  );
}
