"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createAcademicYear, updateAcademicYear } from "./actions";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

function toDateInputValue(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function AcademicYearFields({ year }: { year?: AcademicYear }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={year?.name} required placeholder="e.g. 2026-27" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(year?.startDate)} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="endDate">End date</Label>
        <Input id="endDate" name="endDate" type="date" defaultValue={toDateInputValue(year?.endDate)} required />
      </div>
    </>
  );
}

export function CreateAcademicYearDialog() {
  return (
    <FormDialog triggerLabel="+ Add academic year" title="Add academic year" action={createAcademicYear}>
      <AcademicYearFields />
    </FormDialog>
  );
}

export function EditAcademicYearDialog({ year }: { year: AcademicYear }) {
  return (
    <FormDialog
      triggerLabel="Edit"
      title={`Edit ${year.name}`}
      action={(formData) => updateAcademicYear(year.id, formData)}
    >
      <AcademicYearFields year={year} />
    </FormDialog>
  );
}
