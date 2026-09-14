"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/combobox";
import { mockInvoices } from "@/lib/mock/invoices";
import { getStudentById } from "@/lib/mock/students";

const INVOICE_OPTIONS = mockInvoices
  .filter((i) => i.status !== "VOID")
  .map((i) => ({ value: i.id, label: `${i.invoiceNumber} — ${getStudentById(i.studentId)?.fullName ?? i.studentId} (Rs ${i.totalAmount.toLocaleString()})` }));

export function RequestWaiverDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  function reset() {
    setInvoiceId(null);
    setAmount("");
    setReason("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a waiver</DialogTitle>
          <DialogDescription>Reduces what&apos;s already owed on a specific invoice — unlike a Discount, this targets a bill that already exists.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Invoice</FieldLabel>
            <Combobox options={INVOICE_OPTIONS} value={invoiceId} onChange={setInvoiceId} placeholder="Select an invoice" />
          </Field>
          <Field>
            <FieldLabel htmlFor="wv-amount">Amount (Rs)</FieldLabel>
            <Input id="wv-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="wv-reason">Reason</FieldLabel>
            <Textarea id="wv-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!invoiceId || !amount || !reason.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Waiver request sent for approval.");
              reset();
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
