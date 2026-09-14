"use client";

import { useState } from "react";
import { MoreHorizontal, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getStudentById } from "@/lib/mock/students";
import type { StudentFee } from "@/lib/mock/student-fees";

export function StudentFeeRowActions({ studentFee }: { studentFee: StudentFee }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const student = getStudentById(studentFee.studentId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem variant="destructive" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Remove this fee from ${student?.fullName}?`}
        description="Stops future invoices from including it. Past invoices already generated are unaffected."
        confirmLabel="Remove"
        successMessage="Fee assignment removed."
      />
    </>
  );
}
