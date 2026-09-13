"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { InchargeScope } from "@/lib/mock/incharge-scopes";
import { ScopeSheet } from "./scope-sheet";

export function ScopeRowActions({ scope }: { scope: InchargeScope }) {
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem disabled={scope.revoked} onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={scope.revoked} onClick={() => setRevokeOpen(true)}>
            <Ban className="size-3.5" />
            Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScopeSheet scope={scope} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke this scope?"
        description="Takes effect immediately. The Incharge loses access to these classes/sections right away — this cannot be undone."
        confirmLabel="Revoke"
        successMessage="Scope revoked."
      />
    </>
  );
}
