"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { SectionPicker, type SectionOption } from "@/components/section-picker";
import { createEnrollment, transferEnrollment } from "./actions";

export function EnrollDialog({ studentId, sections }: { studentId: string; sections: SectionOption[] }) {
  const disabled = sections.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Enroll"
      title="Enroll student"
      description={disabled ? "No sections exist yet — create one under Sections first." : undefined}
      action={(formData) => createEnrollment(studentId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label>Section</Label>
        <SectionPicker sections={sections} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rollNumber">Roll number</Label>
        <Input id="rollNumber" name="rollNumber" disabled={disabled} />
      </div>
    </FormDialog>
  );
}

export function TransferDialog({
  studentId,
  enrollmentId,
  sections,
}: {
  studentId: string;
  enrollmentId: string;
  sections: SectionOption[]; // pre-filtered to the enrollment's academic year
}) {
  const disabled = sections.length === 0;

  return (
    <FormDialog
      triggerLabel="Transfer"
      title="Transfer to a different class/section"
      description="Creates a new enrollment record and marks the current one as transferred — history is preserved."
      action={(formData) => transferEnrollment(studentId, enrollmentId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label>New section</Label>
        <SectionPicker sections={sections} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rollNumber">New roll number</Label>
        <Input id="rollNumber" name="rollNumber" disabled={disabled} />
      </div>
    </FormDialog>
  );
}

export type { SectionOption };
