"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { submitResult, reviewResult, finalizeResult, publishResult } from "./actions";

const STEP_BY_STATUS: Record<string, { label: string; title: string; description: string; action: (id: string) => Promise<{ error?: string } | void> } | undefined> = {
  DRAFT: {
    label: "Submit",
    title: "Submit this result?",
    description: "Marks entry is closed once submitted — further changes require review to complete first.",
    action: submitResult,
  },
  SUBMITTED: {
    label: "Review",
    title: "Mark this result as reviewed?",
    description: "Confirms the entered marks have been checked.",
    action: reviewResult,
  },
  REVIEWED: {
    label: "Finalize",
    title: "Finalize (lock) this result?",
    description: "After finalizing, marks can only change through a correction request.",
    action: finalizeResult,
  },
  FINALIZED: {
    label: "Publish",
    title: "Publish this result?",
    description: "Makes the result visible to parents/students.",
    action: publishResult,
  },
};

export function StatusActionButton({ resultId, status }: { resultId: string; status: string }) {
  const step = STEP_BY_STATUS[status];
  if (!step) return null;

  return (
    <ConfirmActionButton
      label={step.label}
      confirmTitle={step.title}
      confirmDescription={step.description}
      action={() => step.action(resultId)}
    />
  );
}
