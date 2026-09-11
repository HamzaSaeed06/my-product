"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/form-dialog";
import { resolveComplaint } from "./actions";

export function ResolveComplaintDialog({ complaintId }: { complaintId: string }) {
  return (
    <FormDialog
      triggerLabel="Resolve"
      title="Resolve this complaint"
      action={(formData) => resolveComplaint(complaintId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="resolution-note">Resolution note</Label>
        <Textarea id="resolution-note" name="resolutionNote" required rows={4} />
      </div>
    </FormDialog>
  );
}
