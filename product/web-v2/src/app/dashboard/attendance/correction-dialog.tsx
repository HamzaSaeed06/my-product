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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/mock/attendance";

const STATUS_LABEL: Record<AttendanceStatus, string> = { PRESENT: "Present", ABSENT: "Absent", LEAVE: "Leave" };

export function CorrectionDialog({
  record,
  studentName,
  onOpenChange,
  onSubmit,
}: {
  record: AttendanceRecord | null;
  studentName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (requestedStatus: AttendanceStatus, reason: string) => void;
}) {
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>("PRESENT");
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={!!record}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setReason("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a correction</DialogTitle>
          <DialogDescription>
            {studentName} is currently marked <strong>{record ? STATUS_LABEL[record.status] : ""}</strong>. This goes to
            an Incharge or Campus Head for approval — it doesn&apos;t change the record directly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Correct status</FieldLabel>
            <Select value={requestedStatus} onValueChange={(v) => setRequestedStatus(v as AttendanceStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value) => STATUS_LABEL[value as AttendanceStatus]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["PRESENT", "ABSENT", "LEAVE"] as AttendanceStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="corr-reason">Reason</FieldLabel>
            <Textarea id="corr-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why was the original mark wrong?" />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              onSubmit(requestedStatus, reason.trim());
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
