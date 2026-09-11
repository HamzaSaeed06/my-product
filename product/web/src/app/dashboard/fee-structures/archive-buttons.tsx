"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveFeeCategory, archiveFeeStructure } from "./actions";

export function ArchiveCategoryButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle="Archive this fee category?"
      confirmDescription="It will no longer be selectable for new fee structures."
      destructive
      action={() => archiveFeeCategory(id)}
    />
  );
}

export function ArchiveStructureButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle="Archive this fee structure?"
      confirmDescription="Blocked while any student is still actively assigned to it."
      destructive
      action={() => archiveFeeStructure(id)}
    />
  );
}
