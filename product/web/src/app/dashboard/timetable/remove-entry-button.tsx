"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { removeTimetableEntry } from "./actions";

export function RemoveEntryButton({ entryId }: { entryId: string }) {
  return (
    <ConfirmActionButton
      label="Remove"
      confirmTitle="Remove this period?"
      confirmDescription="This slot will be cleared. The change is logged in the audit trail."
      destructive
      action={() => removeTimetableEntry(entryId)}
    />
  );
}
