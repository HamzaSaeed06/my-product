"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ReconciliationException } from "@/lib/mock/reconciliation";

// Resolving/rejecting an exception is gated by payment.reverse in the real
// backend — the same permission that decides a payment reversal, since
// resolving one often means manually recording or correcting a Payment.
export function ExceptionRowActions({ exception }: { exception: ReconciliationException }) {
  const [action, setAction] = useState<"resolve" | "reject" | null>(null);

  if (exception.status !== "PENDING") return null;

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setAction("reject")}>
          <X className="size-3.5" />
          Reject
        </Button>
        <Button size="sm" onClick={() => setAction("resolve")}>
          <Check className="size-3.5" />
          Resolve
        </Button>
      </div>
      <ConfirmDialog
        open={action === "resolve"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Mark this exception resolved?"
        description="Confirms it's been manually accounted for — recorded as a payment, or explained and written off."
        confirmLabel="Resolve"
        successMessage="Exception resolved."
      />
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(v) => !v && setAction(null)}
        title="Reject this exception?"
        description="Marks it as not a real discrepancy — no further action needed."
        confirmLabel="Reject"
        successMessage="Exception rejected."
      />
    </>
  );
}
