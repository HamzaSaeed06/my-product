"use client";

import { useState } from "react";
import { MoreHorizontal, ArrowRightLeft, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Enrollment } from "@/lib/mock/enrollments";
import { mockStudents } from "@/lib/mock/students";
import { TransferSheet } from "./transfer-sheet";

export function EnrollmentRowActions({ enrollment }: { enrollment: Enrollment }) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const isActive = enrollment.status === "ACTIVE";
  const student = mockStudents.find((s) => s.id === enrollment.studentId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" disabled={!isActive} />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="size-3.5" />
            Transfer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setWithdrawOpen(true)}>
            <UserMinus className="size-3.5" />
            Withdraw
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransferSheet enrollment={enrollment} open={transferOpen} onOpenChange={setTransferOpen} />
      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title={`Withdraw ${student?.fullName}?`}
        description="Ends this enrollment — the student's record and history are kept, this just stops their placement in this section."
        confirmLabel="Withdraw"
        successMessage="Enrollment withdrawn."
      />
    </>
  );
}
