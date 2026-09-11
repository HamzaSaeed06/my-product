"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { cancelPortalLeave } from "./actions";

export function CancelPortalLeaveButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Cancel"
      confirmTitle="Cancel this leave request?"
      confirmDescription=""
      destructive
      action={() => cancelPortalLeave(id)}
    />
  );
}
