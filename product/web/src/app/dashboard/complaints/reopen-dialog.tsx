"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/form-dialog";
import { reopenComplaint } from "./actions";

export function ReopenComplaintDialog({ complaintId }: { complaintId: string }) {
  return (
    <FormDialog
      triggerLabel="Reopen"
      title="Reopen this complaint"
      description="Use this when new information surfaces after closing."
      action={(formData) => reopenComplaint(complaintId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="reopen-reason">Reason</Label>
        <Textarea id="reopen-reason" name="reason" required rows={3} />
      </div>
    </FormDialog>
  );
}
