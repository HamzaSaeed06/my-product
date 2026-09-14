"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { CashClosing } from "@/lib/mock/cash-closing";

export function CashClosingRowActions({ closing }: { closing: CashClosing }) {
  const [approveOpen, setApproveOpen] = useState(false);

  if (closing.status !== "PENDING") return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setApproveOpen(true)}>
        <Check className="size-3.5" />
        Approve
      </Button>
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve this cash closing?"
        description={closing.variance !== 0 ? `There's a variance of Rs ${closing.variance.toLocaleString()} — approving accepts it as explained/reconciled.` : "Confirms the day's cash count matches expectations."}
        confirmLabel="Approve"
        successMessage="Cash closing approved."
      />
    </>
  );
}
