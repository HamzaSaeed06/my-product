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
import type { Section } from "@/lib/mock/sections";
import { SectionSheet } from "./section-sheet";

export function SectionRowActions({ section }: { section: Section }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem disabled={section.archived} onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={section.archived} onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SectionSheet section={section} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive Section ${section.name}?`}
        description="Students currently enrolled in this section are unaffected, but it stops accepting new enrollments."
        confirmLabel="Archive"
        successMessage={`Section ${section.name} archived.`}
      />
    </>
  );
}
