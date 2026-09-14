"use client";

import { useState } from "react";
import { MoreHorizontal, Check, X, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Refund } from "@/lib/mock/refunds";

export function RefundRowActions({ refund }: { refund: Refund }) {
  const [action, setAction] = useState<"approve" | "reject" | "complete" | null>(null);

  if (refund.status !== "PENDING" && refund.status !== "APPROVED") {
    return <Button variant="ghost" size="icon" className="size-8" disabled><MoreHorizontal className="size-4" /></Button>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {refund.status === "PENDING" && (
            <>
              <DropdownMenuItem onClick={() => setAction("approve")}>
                <Check className="size-3.5" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setAction("reject")}>
                <X className="size-3.5" />
                Reject
              </DropdownMenuItem>
            </>
          )}
          {refund.status === "APPROVED" && (
            <DropdownMenuItem onClick={() => setAction("complete")}>
              <BadgeCheck className="size-3.5" />
              Mark completed
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={action === "approve"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Approve this refund?"
        description="Approval alone doesn't move money — mark it completed once it's actually paid out."
        confirmLabel="Approve"
        successMessage="Refund approved."
      />
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Reject this refund request?"
        description="No money moves — the original payment stands as-is."
        confirmLabel="Reject"
        successMessage="Refund rejected."
      />
      <ConfirmDialog
        open={action === "complete"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Mark this refund completed?"
        description="Confirms the money has actually been paid out — for an online payment, this also triggers the gateway-side reversal."
        confirmLabel="Mark completed"
        successMessage="Refund completed."
      />
    </>
  );
}
