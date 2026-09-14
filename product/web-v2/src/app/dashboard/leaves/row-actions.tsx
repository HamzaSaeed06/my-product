"use client";

import { useState } from "react";
import { MoreHorizontal, Check, X, Forward, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Leave } from "@/lib/mock/leaves";

export function LeaveRowActions({ leave }: { leave: Leave }) {
  const [action, setAction] = useState<"approve" | "reject" | "forward" | "cancel" | null>(null);
  const isPending = leave.status === "PENDING";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" disabled={!isPending} />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setAction("approve")}>
            <Check className="size-3.5" />
            Approve
          </DropdownMenuItem>
          {leave.subjectType === "STUDENT" && (
            <DropdownMenuItem onClick={() => setAction("forward")}>
              <Forward className="size-3.5" />
              Forward to class teacher
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setAction("reject")}>
            <X className="size-3.5" />
            Reject
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setAction("cancel")}>
            <Undo2 className="size-3.5" />
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog open={action === "approve"} onOpenChange={(v) => !v && setAction(null)} title="Approve this leave?" description="Marks the relevant days as Leave on their attendance." confirmLabel="Approve" successMessage="Leave approved." />
      <ConfirmDialog open={action === "reject"} onOpenChange={(v) => !v && setAction(null)} title="Reject this leave request?" description="Terminal — a new request would need to be submitted." confirmLabel="Reject" successMessage="Leave rejected." />
      <ConfirmDialog open={action === "forward"} onOpenChange={(v) => !v && setAction(null)} title="Forward to the section's class teacher?" description="Hands the decision to the class teacher instead of deciding it yourself." confirmLabel="Forward" successMessage="Leave forwarded." />
      <ConfirmDialog open={action === "cancel"} onOpenChange={(v) => !v && setAction(null)} title="Cancel this leave request?" description="Withdraws the request — it won't be decided at all." confirmLabel="Cancel request" successMessage="Leave request cancelled." />
    </>
  );
}
