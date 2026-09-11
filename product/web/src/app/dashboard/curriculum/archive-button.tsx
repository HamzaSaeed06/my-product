"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { archiveCurriculumTopic } from "./actions";

export function ArchiveTopicButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle="Archive this topic?"
      confirmDescription="It will no longer appear in the curriculum list. History is preserved, not deleted."
      destructive
      action={() => archiveCurriculumTopic(id)}
    />
  );
}
