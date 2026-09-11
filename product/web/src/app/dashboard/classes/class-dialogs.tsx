"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createClass, updateClass } from "./actions";

interface Klass {
  id: string;
  name: string;
  sortOrder: number;
}

function ClassFields({ klass }: { klass?: Klass }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={klass?.name} required placeholder="e.g. Class 5" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={klass?.sortOrder ?? 0} />
      </div>
    </>
  );
}

export function CreateClassDialog() {
  return (
    <FormDialog triggerLabel="+ Add class" title="Add class" action={createClass}>
      <ClassFields />
    </FormDialog>
  );
}

export function EditClassDialog({ klass }: { klass: Klass }) {
  return (
    <FormDialog
      triggerLabel="Edit"
      title={`Edit ${klass.name}`}
      action={(formData) => updateClass(klass.id, formData)}
    >
      <ClassFields klass={klass} />
    </FormDialog>
  );
}
