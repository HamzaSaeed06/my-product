"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createWaiver } from "./actions";

interface InvoiceOption {
  id: string;
  label: string;
}

export function CreateWaiverDialog({ invoices }: { invoices: InvoiceOption[] }) {
  const disabled = invoices.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Request waiver"
      title="Request a fee waiver"
      description={disabled ? "Need at least one unpaid/partially-paid invoice first." : undefined}
      action={createWaiver}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="waiver-invoice">Invoice</Label>
        <Select name="invoiceId" disabled={disabled}>
          <SelectTrigger id="waiver-invoice" className="w-full">
            <SelectValue placeholder="Select an invoice" />
          </SelectTrigger>
          <SelectContent>
            {invoices.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="waiver-amount">Amount</Label>
        <Input id="waiver-amount" name="amount" required placeholder="Full or partial amount" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="waiver-reason">Reason</Label>
        <Input id="waiver-reason" name="reason" required placeholder="e.g. Financial hardship" />
      </div>
    </FormDialog>
  );
}
