"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { publishHomework } from "./actions";

export function PublishHomeworkButton({ id }: { id: string }) {
  return (
    <ConfirmActionButton
      label="Publish"
      confirmTitle="Publish this homework?"
      confirmDescription="It becomes visible to students/parents in that section."
      action={() => publishHomework(id)}
    />
  );
}
