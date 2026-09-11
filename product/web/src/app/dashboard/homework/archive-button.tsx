"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveHomework } from "./actions";

export function ArchiveHomeworkButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle="Archive this homework?"
      confirmDescription="It will no longer appear in the list. History is preserved, not deleted."
      destructive
      action={() => archiveHomework(id)}
    />
  );
}
