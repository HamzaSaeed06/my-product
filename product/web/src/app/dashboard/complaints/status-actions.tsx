"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { startComplaintProgress, closeComplaint } from "./actions";

export function StartProgressButton({ complaintId }: { complaintId: string }) {
  return (
    <ConfirmActionButton
      label="Start progress"
      confirmTitle="Start investigating this complaint?"
      confirmDescription=""
      action={() => startComplaintProgress(complaintId)}
    />
  );
}

export function CloseComplaintButton({ complaintId }: { complaintId: string }) {
  return (
    <ConfirmActionButton
      label="Close"
      confirmTitle="Close this complaint?"
      confirmDescription="Only possible after it has been resolved. It can be reopened later if needed."
      action={() => closeComplaint(complaintId)}
    />
  );
}
