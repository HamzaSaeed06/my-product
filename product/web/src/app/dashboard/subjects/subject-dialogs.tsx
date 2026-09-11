"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createSubject, updateSubject } from "./actions";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

function SubjectFields({ subject }: { subject?: Subject }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={subject?.name} required placeholder="e.g. Mathematics" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" defaultValue={subject?.code ?? ""} placeholder="e.g. MATH" />
      </div>
    </>
  );
}

export function CreateSubjectDialog() {
  return (
    <FormDialog triggerLabel="+ Add subject" title="Add subject" action={createSubject}>
      <SubjectFields />
    </FormDialog>
  );
}

export function EditSubjectDialog({ subject }: { subject: Subject }) {
  return (
    <FormDialog
      triggerLabel="Edit"
      title={`Edit ${subject.name}`}
      action={(formData) => updateSubject(subject.id, formData)}
    >
      <SubjectFields subject={subject} />
    </FormDialog>
  );
}
