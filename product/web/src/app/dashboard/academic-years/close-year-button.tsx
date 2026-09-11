"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { closeAcademicYear } from "./actions";

export function CloseYearButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Close"
      confirmTitle={`Close ${name}?`}
      confirmDescription="Closed academic years become read-only — no further edits or new sections. This cannot be undone from here."
      destructive
      action={() => closeAcademicYear(id)}
    />
  );
}
