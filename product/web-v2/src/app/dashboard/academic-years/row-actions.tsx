"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { AcademicYear } from "@/lib/mock/academic-years";
import { AcademicYearSheet } from "./academic-year-sheet";

export function AcademicYearRowActions({ year }: { year: AcademicYear }) {
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const isActive = year.status === "ACTIVE";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled={!isActive} onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={!isActive} onClick={() => setCloseOpen(true)}>
            <Lock className="size-3.5" />
            Close year
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AcademicYearSheet year={year} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={`Close ${year.name}?`}
        description="Closed years become fully read-only — no edits, no new sections. This cannot be undone from here."
        confirmLabel="Close year"
        successMessage={`${year.name} closed.`}
      />
    </>
  );
}
