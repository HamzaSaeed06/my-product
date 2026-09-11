"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createComplaint } from "./actions";

interface NamedOption {
  id: string;
  label: string;
}

export function CreateComplaintDialog({ students }: { students: NamedOption[] }) {
  return (
    <FormDialog
      triggerLabel="+ Submit complaint"
      title="Submit a complaint"
      description="Leave the student unselected for a general/facilities complaint."
      action={createComplaint}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="complaint-student">Student (optional)</Label>
        <Select name="studentId">
          <SelectTrigger id="complaint-student" className="w-full">
            <SelectValue placeholder="No specific student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="complaint-category">Category</Label>
        <Input id="complaint-category" name="category" required placeholder="e.g. Bullying, Facilities, Discipline" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="complaint-description">Description</Label>
        <Textarea id="complaint-description" name="description" required rows={4} />
      </div>
    </FormDialog>
  );
}
