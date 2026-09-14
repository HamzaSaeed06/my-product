"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, KeyRound, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { RoleDef } from "@/lib/mock/roles";
import { usersAssignedTo } from "./columns";

export function RoleRowActions({ role }: { role: RoleDef }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const inUse = usersAssignedTo(role.id) > 0;
  const canArchive = !role.systemKey && !inUse && !role.archivedAt;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem render={<Link href={`/dashboard/roles/${role.id}/permissions`} />}>
            <KeyRound className="size-3.5" />
            Edit permissions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!canArchive}
            onClick={() => setArchiveOpen(true)}
          >
            <Archive className="size-3.5" />
            {role.systemKey ? "System role" : inUse ? "In use" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive "${role.name}"?`}
        description="Only possible for a custom role with no users currently assigned to it."
        confirmLabel="Archive"
        successMessage="Role archived."
      />
    </>
  );
}
