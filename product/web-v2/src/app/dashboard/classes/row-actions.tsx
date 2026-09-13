"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { SchoolClass } from "@/lib/mock/classes";
import { ClassSheet } from "./class-sheet";

export function ClassRowActions({ schoolClass }: { schoolClass: SchoolClass }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem disabled={schoolClass.archived} onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={schoolClass.archived} onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ClassSheet schoolClass={schoolClass} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${schoolClass.name}?`}
        description="Blocked if this class has any active sections — archive or move those sections first."
        confirmLabel="Archive"
        successMessage={`${schoolClass.name} archived.`}
      />
    </>
  );
}
