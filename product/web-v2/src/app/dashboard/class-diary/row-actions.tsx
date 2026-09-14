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
import type { ClassDiaryEntry } from "@/lib/mock/class-diary";

export function ClassDiaryRowActions({ entry, onEdit }: { entry: ClassDiaryEntry; onEdit: (entry: ClassDiaryEntry) => void }) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onEdit(entry)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive this diary entry?"
        description="Removes it from the section's visible log. Kept in history, not deleted."
        confirmLabel="Archive"
        successMessage="Diary entry archived."
      />
    </>
  );
}
