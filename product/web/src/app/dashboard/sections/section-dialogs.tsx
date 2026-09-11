"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createSection, updateSection } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  capacity: number | null;
}

export function CreateSectionDialog({
  classes,
  campuses,
  academicYears,
}: {
  classes: NamedOption[];
  campuses: NamedOption[];
  academicYears: NamedOption[];
}) {
  const disabled = classes.length === 0 || campuses.length === 0 || academicYears.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Add section"
      title="Add section"
      description={disabled ? "Create at least one class, campus, and academic year first." : undefined}
      action={createSection}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="classId">Class</Label>
        <Select name="classId" disabled={disabled}>
          <SelectTrigger id="classId" className="w-full">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="campusId">Campus</Label>
        <Select name="campusId" disabled={disabled}>
          <SelectTrigger id="campusId" className="w-full">
            <SelectValue placeholder="Select a campus" />
          </SelectTrigger>
          <SelectContent>
            {campuses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="academicYearId">Academic year</Label>
        <Select name="academicYearId" disabled={disabled}>
          <SelectTrigger id="academicYearId" className="w-full">
            <SelectValue placeholder="Select an academic year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Section name</Label>
        <Input id="name" name="name" required placeholder="e.g. A" disabled={disabled} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" name="capacity" type="number" disabled={disabled} />
      </div>
    </FormDialog>
  );
}

export function EditSectionDialog({ section }: { section: Section }) {
  return (
    <FormDialog
      triggerLabel="Edit"
      title={`Edit Section ${section.name}`}
      action={(formData) => updateSection(section.id, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Section name</Label>
        <Input id="name" name="name" defaultValue={section.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" name="capacity" type="number" defaultValue={section.capacity ?? undefined} />
      </div>
    </FormDialog>
  );
}
