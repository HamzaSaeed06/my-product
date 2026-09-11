"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/form-dialog";
import { requestMarksCorrection } from "./actions";

export function RequestMarksCorrectionDialog({
  assessmentId,
  resultId,
  currentMarks,
  totalMarks,
}: {
  assessmentId: string;
  resultId: string;
  currentMarks: number;
  totalMarks: number;
}) {
  return (
    <FormDialog
      triggerLabel="Request correction"
      title="Request a marks correction"
      description={`Currently: ${currentMarks}/${totalMarks}. An Incharge must approve this change.`}
      action={(formData) => requestMarksCorrection(assessmentId, resultId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-marks-${resultId}`}>Correct marks</Label>
        <Input id={`new-marks-${resultId}`} name="newMarks" type="number" min={0} max={totalMarks} defaultValue={currentMarks} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`reason-${resultId}`}>Reason</Label>
        <Input id={`reason-${resultId}`} name="reason" required />
      </div>
    </FormDialog>
  );
}
