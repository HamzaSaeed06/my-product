"use client";

import { useState } from "react";
import { MoreHorizontal, Check, X, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Admission } from "@/lib/mock/admissions";

// All three decisions are terminal from PENDING — a rejected applicant
// reapplies as a new Admission rather than this one flipping back.
export function AdmissionRowActions({ admission }: { admission: Admission }) {
  const [action, setAction] = useState<"approve" | "reject" | "withdraw" | null>(null);
  const isPending = admission.status === "PENDING";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" disabled={!isPending} />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setAction("approve")}>
            <Check className="size-3.5" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setAction("reject")}>
            <X className="size-3.5" />
            Reject
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setAction("withdraw")}>
            <Undo2 className="size-3.5" />
            Withdraw
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={action === "approve"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Approve this admission?"
        description="This only marks the admission approved — it does not create an enrollment. Enroll the student separately from their student page once approved."
        confirmLabel="Approve"
        successMessage="Admission approved."
      />
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Reject this admission?"
        description="Terminal — the applicant can reapply as a new admission, this one won't be reopened."
        confirmLabel="Reject"
        successMessage="Admission rejected."
      />
      <ConfirmDialog
        open={action === "withdraw"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Withdraw this application?"
        description="Use this when the applicant themselves pulls out — terminal, same as a rejection."
        confirmLabel="Withdraw"
        successMessage="Admission withdrawn."
      />
    </>
  );
}
