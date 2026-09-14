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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AssessmentMark } from "@/lib/mock/assessments";

export function MarksCorrectionDialog({
  mark,
  studentName,
  onOpenChange,
  onSubmit,
}: {
  mark: AssessmentMark | null;
  studentName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (requestedMarks: number, reason: string) => void;
}) {
  const [marks, setMarks] = useState(String(mark?.marksObtained ?? ""));
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={!!mark}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setReason("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a marks correction</DialogTitle>
          <DialogDescription>
            {studentName} is currently marked <strong>{mark?.marksObtained ?? "—"}</strong>. This goes to an Incharge
            for approval — it doesn&apos;t change the record directly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="corr-marks">Correct marks</FieldLabel>
            <Input id="corr-marks" type="number" value={marks} onChange={(e) => setMarks(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="corr-reason">Reason</FieldLabel>
            <Textarea id="corr-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why was the original mark wrong?" />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!reason.trim() || marks === ""}
            onClick={() => {
              onSubmit(Number(marks), reason.trim());
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
