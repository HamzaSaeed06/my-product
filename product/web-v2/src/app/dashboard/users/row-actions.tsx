"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, ShieldPlus, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { AppUser } from "@/lib/mock/app-users";
import { ManageRolesSheet } from "./manage-roles-sheet";

export function UserRowActions({ user }: { user: AppUser }) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setRolesOpen(true)}>
            <ShieldPlus className="size-3.5" />
            Manage roles
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.isActive ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDeactivateOpen(true)}>
              <UserX className="size-3.5" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => toast.success(`${user.fullName} reactivated.`)}>
              <UserCheck className="size-3.5" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageRolesSheet user={user} open={rolesOpen} onOpenChange={setRolesOpen} />
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={`Deactivate ${user.fullName}?`}
        description="Kills their active sessions immediately. They can be reactivated any time from this same menu."
        confirmLabel="Deactivate"
        successMessage={`${user.fullName} deactivated.`}
      />
    </>
  );
}
