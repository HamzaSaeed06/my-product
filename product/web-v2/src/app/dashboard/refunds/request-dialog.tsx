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
import { mockPayments } from "@/lib/mock/payments";
import { getStudentById } from "@/lib/mock/students";

const PAYMENT_OPTIONS = mockPayments
  .filter((p) => p.status === "SUCCESS")
  .map((p) => ({ value: p.id, label: `${p.paymentNumber} — ${getStudentById(p.studentId)?.fullName ?? p.studentId} (Rs ${p.amount.toLocaleString()})` }));

export function RequestRefundDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  function reset() {
    setPaymentId(null);
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
          <DialogTitle>Request a refund</DialogTitle>
          <DialogDescription>Always against a specific Payment, not an invoice. Approval doesn&apos;t move money by itself — completing it does.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Payment</FieldLabel>
            <Combobox options={PAYMENT_OPTIONS} value={paymentId} onChange={setPaymentId} placeholder="Select a payment" />
          </Field>
          <Field>
            <FieldLabel htmlFor="rf-amount">Amount (Rs)</FieldLabel>
            <Input id="rf-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="rf-reason">Reason</FieldLabel>
            <Textarea id="rf-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!paymentId || !amount || !reason.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Refund request sent for approval.");
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
