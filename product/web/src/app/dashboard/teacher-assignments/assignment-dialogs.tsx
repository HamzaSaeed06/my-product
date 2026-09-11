"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { SectionPicker, type SectionOption } from "@/components/section-picker";
import { createTeacherAssignment } from "./actions";

interface TeacherOption {
  id: string;
  name: string;
}
interface NamedOption {
  id: string;
  name: string;
}

export function CreateAssignmentDialog({
  teachers,
  subjects,
  sections,
}: {
  teachers: TeacherOption[];
  subjects: NamedOption[];
  sections: SectionOption[];
}) {
  const disabled = teachers.length === 0 || subjects.length === 0 || sections.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Assign teacher"
      title="Assign a teacher to a subject/section"
      description={disabled ? "Need at least one teacher, subject, and section first." : undefined}
      action={createTeacherAssignment}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <Select name="teacherId" disabled={disabled}>
          <SelectTrigger id="teacherId" className="w-full">
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
        <Label htmlFor="subjectId">Subject</Label>
        <Select name="subjectId" disabled={disabled}>
          <SelectTrigger id="subjectId" className="w-full">
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
        <Label>Section</Label>
        <SectionPicker sections={sections} />
      </div>
    </FormDialog>
  );
}
