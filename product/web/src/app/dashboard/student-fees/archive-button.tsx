"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveStudentFee } from "./actions";

export function ArchiveStudentFeeButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle="Archive this fee assignment?"
      confirmDescription="The student will no longer be charged this fee going forward."
      destructive
      action={() => archiveStudentFee(id)}
    />
  );
}
