"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { decideDiscount } from "./actions";

export function DecideDiscountButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmActionButton
        label="Approve"
        confirmTitle="Approve this discount?"
        confirmDescription=""
        action={() => decideDiscount(id, "APPROVED")}
      />
      <ConfirmActionButton
        label="Reject"
        confirmTitle="Reject this discount?"
        confirmDescription=""
        destructive
        action={() => decideDiscount(id, "REJECTED")}
      />
    </div>
  );
}
