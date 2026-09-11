"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveCampus } from "./actions";

export function ArchiveCampusButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle={`Archive ${name}?`}
      confirmDescription="This campus will no longer accept new sections. It can't be un-archived from here yet. Archiving is blocked if the campus has any active sections."
      destructive
      action={() => archiveCampus(id)}
    />
  );
}
