"use client";

import { useState } from "react";
import { MoreHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getStudentById } from "@/lib/mock/students";
import type { Discount } from "@/lib/mock/discounts";

export function DiscountRowActions({ discount }: { discount: Discount }) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const student = getStudentById(discount.studentId);
  const isPending = discount.status === "PENDING";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" disabled={!isPending} />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setAction("approve")}>
            <Check className="size-3.5" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setAction("reject")}>
            <X className="size-3.5" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={action === "approve"}
        onOpenChange={(v) => !v && setAction(null)}
        title={`Approve this discount for ${student?.fullName}?`}
        description="Takes effect on the next invoice generated for this fee — existing invoices are unaffected."
        confirmLabel="Approve"
        successMessage="Discount approved."
      />
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Reject this discount request?"
        description="The family keeps paying the full amount."
        confirmLabel="Reject"
        successMessage="Discount rejected."
      />
    </>
  );
}
