"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/combobox";
import type { InchargeScope } from "@/lib/mock/incharge-scopes";
import { getInchargeUsers } from "@/lib/mock/users";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { mockClasses } from "@/lib/mock/classes";
import { mockSections } from "@/lib/mock/sections";

const USER_OPTIONS = getInchargeUsers().map((u) => ({ value: u.id, label: u.fullName }));
const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
const YEAR_OPTIONS = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// User/campus/academic-year are immutable after creation, same as
// Sections — the edit path only touches classIds/sectionIds. An empty
// sectionIds list means "all sections of the selected classes," not "no
// sections" — a deliberate API convention surfaced directly in the copy
// below so it isn't mistaken for a bug.
export function ScopeSheet({
  scope,
  open,
  onOpenChange,
}: {
  scope?: InchargeScope;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [userId, setUserId] = useState<string | null>(scope?.userId ?? null);
  const [campusId, setCampusId] = useState<string | null>(scope?.campusId ?? null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(scope?.academicYearId ?? null);
  const [classIds, setClassIds] = useState<string[]>(scope?.classIds ?? []);
  const [sectionIds, setSectionIds] = useState<string[]>(scope?.sectionIds ?? []);
  const isEdit = !!scope;

  const relevantSections = mockSections.filter(
    (s) => classIds.includes(s.classId) && (!campusId || s.campusId === campusId) && !s.archived
  );

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? "Scope updated." : "Incharge scope created.");
  }

  const userName = getInchargeUsers().find((u) => u.id === scope?.userId)?.fullName;
  const campusName = mockCampuses.find((c) => c.id === scope?.campusId)?.name;
  const yearName = mockAcademicYears.find((y) => y.id === scope?.academicYearId)?.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit incharge scope" : "New incharge scope"}</SheetTitle>
          <SheetDescription>Overlapping scopes across different Incharges are allowed by design.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          {isEdit ? (
            <Field>
              <FieldLabel>Incharge · Campus · Academic year</FieldLabel>
              <p className="text-sm text-foreground">
                {userName} · {campusName} · {yearName}
              </p>
              <FieldDescription>Fixed at creation — not editable afterward.</FieldDescription>
            </Field>
          ) : (
            <>
              <Field>
                <FieldLabel>Incharge</FieldLabel>
                <Combobox options={USER_OPTIONS} value={userId} onChange={setUserId} placeholder="Select an Incharge" />
              </Field>
              <Field>
                <FieldLabel>Campus</FieldLabel>
                <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="Select a campus" />
              </Field>
              <Field>
                <FieldLabel>Academic year</FieldLabel>
                <Combobox options={YEAR_OPTIONS} value={academicYearId} onChange={setAcademicYearId} placeholder="Select a year" />
              </Field>
            </>
          )}

          <Field>
            <FieldLabel>Classes</FieldLabel>
            <div className="flex flex-col gap-2 rounded-[var(--card-radius)] border border-border p-3">
              {mockClasses.filter((c) => !c.archived).map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={classIds.includes(c.id)} onCheckedChange={() => setClassIds((prev) => toggle(prev, c.id))} />
                  {c.name}
                </label>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel>Sections (optional)</FieldLabel>
            <FieldDescription>Leave empty to grant all sections of the selected classes — not &quot;no sections.&quot;</FieldDescription>
            {relevantSections.length ? (
              <div className="flex flex-col gap-2 rounded-[var(--card-radius)] border border-border p-3">
                {relevantSections.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={sectionIds.includes(s.id)} onCheckedChange={() => setSectionIds((prev) => toggle(prev, s.id))} />
                    Section {s.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a class (and campus) above to narrow by section.</p>
            )}
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            onClick={handleSave}
            disabled={classIds.length === 0 || (!isEdit && (!userId || !campusId || !academicYearId))}
          >
            {isEdit ? "Save changes" : "Create scope"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
