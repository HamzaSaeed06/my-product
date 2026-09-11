"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createTicket } from "./actions";

interface CustomerOption {
  id: string;
  name: string;
  customerCode: string;
}

export function CreateTicketDialog({ customers }: { customers: CustomerOption[] }) {
  return (
    <FormDialog triggerLabel="+ New ticket" title="Create a support ticket" action={createTicket}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tck-customer">Customer</Label>
        <Select name="customerId" required>
          <SelectTrigger id="tck-customer" className="w-full">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.customerCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tck-subject">Subject</Label>
        <Input id="tck-subject" name="subject" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tck-description">Description</Label>
        <Textarea id="tck-description" name="description" required rows={4} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tck-priority">Priority</Label>
        <Select name="priority" defaultValue="MEDIUM">
          <SelectTrigger id="tck-priority" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
