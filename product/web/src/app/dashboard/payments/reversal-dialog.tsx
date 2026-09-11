"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/form-dialog";
import { requestPaymentReversal } from "./actions";

export function RequestReversalDialog({ paymentId }: { paymentId: string }) {
  return (
    <FormDialog
      triggerLabel="Request reversal"
      title="Request a payment reversal"
      description="An authorized approver must review this before it takes effect."
      action={(formData) => requestPaymentReversal(paymentId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`reversal-reason-${paymentId}`}>Reason</Label>
        <Input id={`reversal-reason-${paymentId}`} name="reason" required placeholder="e.g. Duplicate entry" />
      </div>
    </FormDialog>
  );
}
