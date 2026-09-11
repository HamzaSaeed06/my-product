"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/form-dialog";
import { voidInvoice } from "./actions";

export function VoidInvoiceDialog({ invoiceId }: { invoiceId: string }) {
  return (
    <FormDialog
      triggerLabel="Void"
      title="Void this invoice?"
      description="Blocked while any payment is still active against it."
      action={(formData) => voidInvoice(invoiceId, String(formData.get("reason")))}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`void-reason-${invoiceId}`}>Reason</Label>
        <Input id={`void-reason-${invoiceId}`} name="reason" required />
      </div>
    </FormDialog>
  );
}
