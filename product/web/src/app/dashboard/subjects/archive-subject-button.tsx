"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveSubject } from "./actions";

export function ArchiveSubjectButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle={`Archive ${name}?`}
      confirmDescription="Archiving is blocked if this subject has any active teacher assignments."
      destructive
      action={() => archiveSubject(id)}
    />
  );
}
