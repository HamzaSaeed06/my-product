"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/form-dialog";
import { addComplaintNote } from "./actions";

export function AddComplaintNoteDialog({ complaintId }: { complaintId: string }) {
  return (
    <FormDialog
      triggerLabel="+ Add note"
      title="Add an investigation note"
      submitLabel="Add note"
      action={(formData) => addComplaintNote(complaintId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" required rows={3} />
      </div>
    </FormDialog>
  );
}
