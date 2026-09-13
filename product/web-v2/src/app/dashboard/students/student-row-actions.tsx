"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Student } from "@/lib/mock/students";
import { EditStudentSheet } from "./edit-student-sheet";
import { DeactivateStudentDialog } from "./deactivate-student-dialog";

export function StudentRowActions({ student }: { student: Student }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/dashboard/students/${student.id}`} />}>
            <Eye className="size-3.5" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit student
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeactivateOpen(true)}>
            <UserX className="size-3.5" />
            Deactivate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditStudentSheet student={student} open={editOpen} onOpenChange={setEditOpen} />
      <DeactivateStudentDialog student={student} open={deactivateOpen} onOpenChange={setDeactivateOpen} />
    </>
  );
}
