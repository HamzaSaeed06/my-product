"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { cancelSubstitution } from "./actions";

export function CancelSubstitutionButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Cancel"
      confirmTitle="Cancel this substitution?"
      confirmDescription="The original teacher will be shown as unassigned for this period again."
      destructive
      action={() => cancelSubstitution(id)}
    />
  );
}
