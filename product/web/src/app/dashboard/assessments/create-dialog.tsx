"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { SectionPicker, type SectionOption } from "@/components/section-picker";
import { createAssessment } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

export function CreateAssessmentDialog({
  sections,
  subjects,
  teachers,
}: {
  sections: SectionOption[];
  subjects: NamedOption[];
  teachers: NamedOption[];
}) {
  const disabled = sections.length === 0 || subjects.length === 0 || teachers.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Add assessment"
      title="Create an assessment"
      description={disabled ? "Need at least one section, subject, and teacher first." : undefined}
      action={createAssessment}
    >
      <div className="flex flex-col gap-2">
        <Label>Section</Label>
        <SectionPicker sections={sections} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="assess-subject">Subject</Label>
        <Select name="subjectId" disabled={disabled}>
          <SelectTrigger id="assess-subject" className="w-full">
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
        <Label htmlFor="assess-teacher">Teacher</Label>
        <Select name="teacherId" disabled={disabled}>
          <SelectTrigger id="assess-teacher" className="w-full">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="assess-title">Title</Label>
        <Input id="assess-title" name="title" required placeholder="e.g. Midterm Quiz" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="assess-total">Total marks</Label>
        <Input id="assess-total" name="totalMarks" type="number" min="1" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="assess-date">Date</Label>
        <Input id="assess-date" name="assessmentDate" type="date" required />
      </div>
    </FormDialog>
  );
}
