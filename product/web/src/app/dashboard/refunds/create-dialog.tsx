"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createRefund } from "./actions";

interface PaymentOption {
  id: string;
  label: string;
}

export function CreateRefundDialog({ payments }: { payments: PaymentOption[] }) {
  const disabled = payments.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Request refund"
      title="Request a refund"
      description={disabled ? "Need at least one successful payment first." : undefined}
      action={createRefund}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="refund-payment">Payment</Label>
        <Select name="paymentId" disabled={disabled}>
          <SelectTrigger id="refund-payment" className="w-full">
            <SelectValue placeholder="Select a payment" />
          </SelectTrigger>
          <SelectContent>
            {payments.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refund-amount">Amount</Label>
        <Input id="refund-amount" name="amount" required placeholder="e.g. 4000.00" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refund-method">Method (optional)</Label>
        <Input id="refund-method" name="method" placeholder="e.g. Bank transfer" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refund-reason">Reason</Label>
        <Input id="refund-reason" name="reason" required placeholder="e.g. Student withdrew mid-year" />
      </div>
    </FormDialog>
  );
}
