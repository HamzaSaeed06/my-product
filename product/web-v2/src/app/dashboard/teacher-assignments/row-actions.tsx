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
import type { TeacherAssignment } from "@/lib/mock/teacher-assignments";

export function AssignmentRowActions({ assignment }: { assignment: TeacherAssignment }) {
  const [endOpen, setEndOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem variant="destructive" disabled={assignment.archived} onClick={() => setEndOpen(true)}>
            <Ban className="size-3.5" />
            End assignment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        title="End this assignment?"
        description="History is preserved, not deleted — this just stops the teacher from teaching this section going forward."
        confirmLabel="End assignment"
        successMessage="Assignment ended."
      />
    </>
  );
}
