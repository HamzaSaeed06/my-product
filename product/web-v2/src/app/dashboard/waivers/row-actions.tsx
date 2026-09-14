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
import type { Waiver } from "@/lib/mock/waivers";

export function WaiverRowActions({ waiver }: { waiver: Waiver }) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const isPending = waiver.status === "PENDING";

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
        title="Approve this waiver?"
        description="Immediately reduces what's owed on the invoice."
        confirmLabel="Approve"
        successMessage="Waiver approved."
      />
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Reject this waiver request?"
        description="The invoice's balance is unaffected."
        confirmLabel="Reject"
        successMessage="Waiver rejected."
      />
    </>
  );
}
