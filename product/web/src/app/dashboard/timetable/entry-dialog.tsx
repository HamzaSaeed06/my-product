"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { addTimetableEntry } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

export function AddEntryDialog({
  timetableId,
  dayOfWeek,
  periodNumber,
  subjects,
  teachers,
}: {
  timetableId: string;
  dayOfWeek: string;
  periodNumber: number;
  subjects: NamedOption[];
  teachers: NamedOption[];
}) {
  const disabled = subjects.length === 0 || teachers.length === 0;

  return (
    <FormDialog
      triggerLabel="+"
      title={`${dayOfWeek[0]}${dayOfWeek.slice(1).toLowerCase()} — Period ${periodNumber}`}
      description={disabled ? "Need at least one subject and one teacher first." : undefined}
      action={(formData) => addTimetableEntry(timetableId, formData)}
    >
      <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
      <input type="hidden" name="periodNumber" value={periodNumber} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`subject-${dayOfWeek}-${periodNumber}`}>Subject</Label>
        <Select name="subjectId" disabled={disabled}>
          <SelectTrigger id={`subject-${dayOfWeek}-${periodNumber}`} className="w-full">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor={`teacher-${dayOfWeek}-${periodNumber}`}>Teacher</Label>
        <Select name="teacherId" disabled={disabled}>
          <SelectTrigger id={`teacher-${dayOfWeek}-${periodNumber}`} className="w-full">
            <SelectValue placeholder="Select a teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
