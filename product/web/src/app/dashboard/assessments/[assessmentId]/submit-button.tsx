"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { submitAssessment } from "./actions";

export function SubmitAssessmentButton({ assessmentId }: { assessmentId: string }) {
  return (
    <ConfirmActionButton
      label="Submit (lock marks)"
      confirmTitle="Submit and lock this assessment?"
      confirmDescription="After submission, marks can only be changed via a correction request that an Incharge must approve."
      action={() => submitAssessment(assessmentId)}
    />
  );
}
