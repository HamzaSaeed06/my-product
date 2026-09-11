"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { assignComplaint } from "./actions";

interface NamedOption {
  id: string;
  label: string;
}

export function AssignComplaintDialog({ complaintId, assignees }: { complaintId: string; assignees: NamedOption[] }) {
  return (
    <FormDialog
      triggerLabel="Assign"
      title="Assign this complaint"
      description={assignees.length === 0 ? "No eligible staff users found." : undefined}
      action={(formData) => assignComplaint(complaintId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="assign-to">Assign to</Label>
        <Select name="assignedToId" disabled={assignees.length === 0}>
          <SelectTrigger id="assign-to" className="w-full">
            <SelectValue placeholder="Select a staff member" />
          </SelectTrigger>
          <SelectContent>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
