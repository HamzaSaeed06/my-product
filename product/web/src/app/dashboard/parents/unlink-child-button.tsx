"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { unlinkChild } from "./actions";

export function UnlinkChildButton({
  parentId,
  linkId,
  studentName,
}: {
  parentId: string;
  linkId: string;
  studentName: string;
}) {
  return (
    <ConfirmActionButton
      label="Unlink"
      confirmTitle={`Unlink ${studentName}?`}
      confirmDescription="This removes the guardian relationship. It does not affect the student record itself."
      action={() => unlinkChild(parentId, linkId)}
    />
  );
}
