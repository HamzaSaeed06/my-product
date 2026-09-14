"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Payment } from "@/lib/mock/payments";

export function RequestReversalDialog({
  payment,
  onOpenChange,
  onSubmit,
}: {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={!!payment}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setReason("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a payment reversal</DialogTitle>
          <DialogDescription>
            {payment?.paymentNumber} — Rs {payment?.amount.toLocaleString()}. Goes to a Campus Head for approval before it takes effect.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="rev-reason">Reason</FieldLabel>
          <Textarea id="rev-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why should this payment be reversed?" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              onSubmit(reason.trim());
              onOpenChange(false);
              setReason("");
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
