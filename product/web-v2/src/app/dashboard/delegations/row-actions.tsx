"use client";

import { useState } from "react";
import { MoreHorizontal, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Delegation } from "@/lib/mock/delegations";

export function DelegationRowActions({ delegation }: { delegation: Delegation }) {
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem variant="destructive" disabled={delegation.revoked} onClick={() => setRevokeOpen(true)}>
            <Ban className="size-3.5" />
            Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke this delegation?"
        description="Takes effect immediately — no cache to invalidate. The delegate loses the granted role's permissions right away."
        confirmLabel="Revoke"
        successMessage="Delegation revoked."
      />
    </>
  );
}
