"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/lib/mock/invoices";

type Step = "confirm" | "processing" | "done";

// Mirrors the real backend's genuinely multi-step flow (initiate -> a
// gateway checkout page -> confirm/cancel) in miniature, since Online
// Payment is confirmed as the one part of Finance actually meant to be
// customer-interactive rather than admin-facing.
export function PayInvoiceDialog({
  invoice,
  onOpenChange,
  onPaid,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onPaid: (invoiceId: string) => void;
}) {
  const [step, setStep] = useState<Step>("confirm");

  function pay() {
    setStep("processing");
    setTimeout(() => {
      setStep("done");
      if (invoice) onPaid(invoice.id);
    }, 1200);
  }

  return (
    <Dialog
      open={!!invoice}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setStep("confirm");
      }}
    >
      <DialogContent>
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Pay {invoice?.invoiceNumber}</DialogTitle>
              <DialogDescription>Rs {invoice?.totalAmount.toLocaleString()} via the Simulated Gateway.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={pay}>Pay Rs {invoice?.totalAmount.toLocaleString()}</Button>
            </DialogFooter>
          </>
        )}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Processing payment…</span>
          </div>
        )}
        {step === "done" && (
          <>
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="size-8 text-success" />
              <span className="text-sm font-medium text-foreground">Payment successful</span>
            </div>
            <DialogFooter showCloseButton />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
