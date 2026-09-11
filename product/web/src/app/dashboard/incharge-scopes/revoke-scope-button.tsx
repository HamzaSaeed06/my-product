"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { revokeInchargeScope } from "./actions";

export function RevokeScopeButton({ id, userName }: { id: string; userName: string }) {
  return (
    <ConfirmActionButton
      label="Revoke"
      confirmTitle={`Revoke this scope for ${userName}?`}
      confirmDescription="This immediately removes their access to the assigned classes/sections. This cannot be undone from here."
      destructive
      action={() => revokeInchargeScope(id)}
    />
  );
}
