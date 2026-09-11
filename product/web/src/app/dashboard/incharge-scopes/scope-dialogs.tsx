"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createInchargeScope, updateInchargeScope } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

interface ScopeSummary {
  id: string;
  version: number;
  classes: { classId: string }[];
  sections: { sectionId: string }[];
}

function CheckboxList({
  name,
  options,
  defaultCheckedIds,
}: {
  name: string;
  options: NamedOption[];
  defaultCheckedIds?: Set<string>;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">None available.</p>;
  }
  return (
    <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3">
      {options.map((opt) => (
        <label key={opt.id} className="flex items-center gap-2 text-sm">
          <Checkbox name={name} value={opt.id} defaultChecked={defaultCheckedIds?.has(opt.id)} />
          {opt.name}
        </label>
      ))}
    </div>
  );
}

export function CreateInchargeScopeDialog({
  inchargeUsers,
  campuses,
  academicYears,
  classes,
}: {
  inchargeUsers: (NamedOption & { email: string })[];
  campuses: NamedOption[];
  academicYears: NamedOption[];
  classes: NamedOption[];
}) {
  const disabled = inchargeUsers.length === 0 || campuses.length === 0 || academicYears.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Assign scope"
      title="Assign Incharge scope"
      description={
        disabled
          ? "Need at least one user with the INCHARGE role, a campus, and an academic year first."
          : "Sections are optional — leave none checked to cover every section of the selected classes."
      }
      action={createInchargeScope}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="userId">Incharge user</Label>
        <Select name="userId" disabled={disabled}>
          <SelectTrigger id="userId" className="w-full">
            <SelectValue placeholder="Select an Incharge" />
          </SelectTrigger>
          <SelectContent>
            {inchargeUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.email})
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
        <Label>Classes</Label>
        <CheckboxList name="classIds" options={classes} />
      </div>
    </FormDialog>
  );
}

export function EditInchargeScopeDialog({
  scope,
  classes,
  sections,
}: {
  scope: ScopeSummary;
  classes: NamedOption[];
  sections: NamedOption[];
}) {
  const currentClassIds = new Set(scope.classes.map((c) => c.classId));
  const currentSectionIds = new Set(scope.sections.map((s) => s.sectionId));

  return (
    <FormDialog
      triggerLabel="Edit"
      title="Edit Incharge scope"
      description="Sections are optional — leave none checked to cover every section of the selected classes."
      action={(formData) => updateInchargeScope(scope.id, scope.version, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label>Classes</Label>
        <CheckboxList name="classIds" options={classes} defaultCheckedIds={currentClassIds} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Sections (optional narrowing)</Label>
        <CheckboxList name="sectionIds" options={sections} defaultCheckedIds={currentSectionIds} />
      </div>
    </FormDialog>
  );
}
