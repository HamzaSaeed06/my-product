"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createCustomer } from "./actions";

export function CreateCustomerDialog() {
  return (
    <FormDialog triggerLabel="+ Add customer" title="Add a customer" action={createCustomer}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cust-name">Institute name</Label>
        <Input id="cust-name" name="name" required placeholder="e.g. Riverside School" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cust-contact-name">Contact name</Label>
        <Input id="cust-contact-name" name="contactName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cust-contact-email">Contact email</Label>
        <Input id="cust-contact-email" name="contactEmail" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cust-contact-phone">Contact phone (optional)</Label>
        <Input id="cust-contact-phone" name="contactPhone" />
      </div>
    </FormDialog>
  );
}
