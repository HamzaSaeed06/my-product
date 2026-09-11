"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveAssessment } from "./actions";

export function ArchiveAssessmentButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle="Archive this assessment?"
      confirmDescription="It will no longer appear in the list. History is preserved, not deleted."
      destructive
      action={() => archiveAssessment(id)}
    />
  );
}
