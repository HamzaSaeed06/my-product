"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { generateReportCard } from "./actions";

export function GenerateReportCardButton({ resultId, regenerate }: { resultId: string; regenerate?: boolean }) {
  return (
    <ConfirmActionButton
      label={regenerate ? "Regenerate" : "Generate"}
      confirmTitle={regenerate ? "Regenerate this report card?" : "Generate a report card?"}
      confirmDescription={
        regenerate
          ? "Overwrites the existing snapshot with the current marks."
          : "Captures a snapshot of the finalized marks for this student."
      }
      action={() => generateReportCard(resultId)}
    />
  );
}
