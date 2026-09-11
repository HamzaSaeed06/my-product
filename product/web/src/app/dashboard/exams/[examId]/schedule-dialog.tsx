"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { SectionPicker, type SectionOption } from "@/components/section-picker";
import { createExamSchedule } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

export function AddScheduleDialog({
  examId,
  sections,
  subjects,
}: {
  examId: string;
  sections: SectionOption[];
  subjects: NamedOption[];
}) {
  const disabled = sections.length === 0 || subjects.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Add paper"
      title="Schedule an exam paper"
      description={disabled ? "Need at least one section and subject first." : undefined}
      action={(formData) => createExamSchedule(examId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label>Section</Label>
        <SectionPicker sections={sections} emitAcademicYearId={false} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sched-subject">Subject</Label>
        <Select name="subjectId" disabled={disabled}>
          <SelectTrigger id="sched-subject" className="w-full">
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
        <Label htmlFor="sched-date">Date</Label>
        <Input id="sched-date" name="date" type="date" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sched-start">Start time</Label>
          <Input id="sched-start" name="startTime" type="time" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sched-end">End time</Label>
          <Input id="sched-end" name="endTime" type="time" required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sched-room">Room (optional)</Label>
        <Input id="sched-room" name="room" />
      </div>
    </FormDialog>
  );
}
