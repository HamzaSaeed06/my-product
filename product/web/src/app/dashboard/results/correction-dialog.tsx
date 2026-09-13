"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/form-dialog";
import { requestResultCorrection } from "./actions";

export function RequestResultCorrectionDialog({
  itemId,
  currentMarks,
  totalMarks,
}: {
  itemId: string;
  currentMarks: number;
  totalMarks: number;
}) {
  return (
    <FormDialog
      triggerLabel="Request correction"
      title="Request a result correction"
      description={`Currently: ${currentMarks}/${totalMarks}. A Campus Head must approve this change.`}
      action={(formData) => requestResultCorrection(itemId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-marks-${itemId}`}>Correct marks</Label>
        <Input id={`new-marks-${itemId}`} name="newMarks" type="number" min={0} max={totalMarks} defaultValue={currentMarks} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`reason-${itemId}`}>Reason</Label>
        <Input id={`reason-${itemId}`} name="reason" required />
      </div>
    </FormDialog>
  );
}
