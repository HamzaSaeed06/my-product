"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { publishTimetable } from "./actions";

export function PublishTimetableButton({ timetableId }: { timetableId: string }) {
  return (
    <ConfirmActionButton
      label="Publish"
      confirmTitle="Publish this timetable?"
      confirmDescription="Once published, changes are still allowed but are treated as changes to a live, in-use schedule."
      action={() => publishTimetable(timetableId)}
    />
  );
}
