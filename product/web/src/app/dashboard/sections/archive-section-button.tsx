"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveSection } from "./actions";

export function ArchiveSectionButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle={`Archive Section ${name}?`}
      confirmDescription="This section will no longer be usable for new enrollment once Phase 2 lands."
      destructive
      action={() => archiveSection(id)}
    />
  );
}
