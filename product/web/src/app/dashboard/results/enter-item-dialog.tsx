"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { enterResultItem } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

export function EnterItemDialog({ resultId, subjects }: { resultId: string; subjects: NamedOption[] }) {
  return (
    <FormDialog
      triggerLabel="+ Add subject marks"
      title="Enter subject marks"
      description={subjects.length === 0 ? "Create a subject first." : undefined}
      action={(formData) => enterResultItem(resultId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`item-subject-${resultId}`}>Subject</Label>
        <Select name="subjectId" disabled={subjects.length === 0}>
          <SelectTrigger id={`item-subject-${resultId}`} className="w-full">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`item-marks-${resultId}`}>Marks obtained</Label>
          <Input id={`item-marks-${resultId}`} name="marksObtained" type="number" min={0} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`item-total-${resultId}`}>Total marks</Label>
          <Input id={`item-total-${resultId}`} name="totalMarks" type="number" min={1} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`item-grade-${resultId}`}>Grade (optional)</Label>
        <Input id={`item-grade-${resultId}`} name="grade" placeholder="e.g. A" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`item-remarks-${resultId}`}>Remarks (optional)</Label>
        <Input id={`item-remarks-${resultId}`} name="remarks" />
      </div>
    </FormDialog>
  );
}
