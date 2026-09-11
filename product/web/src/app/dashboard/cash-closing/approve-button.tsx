"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { approveCashClosing } from "./actions";

export function ApproveCashClosingButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Approve"
      confirmTitle="Approve this cash closing?"
      confirmDescription="Confirms the reported variance has been reviewed."
      action={() => approveCashClosing(id)}
    />
  );
}
