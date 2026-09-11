"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveTeacher } from "./actions";

export function ArchiveTeacherButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle={`Archive ${name}?`}
      confirmDescription="Archiving is blocked if this teacher has any active assignments."
      destructive
      action={() => archiveTeacher(id)}
    />
  );
}
