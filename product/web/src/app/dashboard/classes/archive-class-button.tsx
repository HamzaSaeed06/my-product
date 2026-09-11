"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveClass } from "./actions";

export function ArchiveClassButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle={`Archive ${name}?`}
      confirmDescription="Archiving is blocked if this class has any active sections."
      destructive
      action={() => archiveClass(id)}
    />
  );
}
