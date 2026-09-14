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

export function RequestLeaveDialog({
  open,
  onOpenChange,
  forName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forName: string;
}) {
  const [fromDate, setFromDate] = useState("2026-09-16");
  const [toDate, setToDate] = useState("2026-09-16");
  const [reason, setReason] = useState("");

  function reset() {
    setFromDate("2026-09-16");
    setToDate("2026-09-16");
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
          <DialogTitle>Request leave for {forName}</DialogTitle>
          <DialogDescription>A request in the past is marked retrospective automatically.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pl-from">From</FieldLabel>
              <Input id="pl-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pl-to">To</FieldLabel>
              <Input id="pl-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="pl-reason">Reason</FieldLabel>
            <Textarea id="pl-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Leave request submitted.");
              reset();
            }}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
