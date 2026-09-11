"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveTeacherAssignment } from "./actions";

export function ArchiveAssignmentButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="End assignment"
      confirmTitle="End this teacher assignment?"
      confirmDescription="The teacher will no longer be assigned to this subject/section. History is preserved, not deleted."
      destructive
      action={() => archiveTeacherAssignment(id)}
    />
  );
}
