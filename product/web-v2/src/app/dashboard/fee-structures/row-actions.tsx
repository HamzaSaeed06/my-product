"use client";

import { useState } from "react";
import { MoreHorizontal, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { FeeStructure } from "@/lib/mock/fee-structures";

export function FeeStructureRowActions({ structure }: { structure: FeeStructure }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const isArchived = !!structure.archivedAt;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem variant={isArchived ? undefined : "destructive"} onClick={() => setArchiveOpen(true)}>
            {isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
            {isArchived ? "Restore" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? `Restore "${structure.name}"?` : `Archive "${structure.name}"?`}
        description={isArchived ? "Makes it assignable to students again." : "Existing assignments are kept — new ones just won't be able to pick it."}
        confirmLabel={isArchived ? "Restore" : "Archive"}
        successMessage={isArchived ? "Fee structure restored." : "Fee structure archived."}
      />
    </>
  );
}
