"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { publishExam } from "./actions";

export function PublishExamButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Publish"
      confirmTitle="Publish this exam schedule?"
      confirmDescription="Once published, the schedule is treated as live/announced — changes are still allowed but are audited."
      action={() => publishExam(id)}
    />
  );
}
