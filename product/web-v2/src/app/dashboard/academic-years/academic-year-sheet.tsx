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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AcademicYear } from "@/lib/mock/academic-years";

// Handles both create (year is undefined) and edit (year is CLOSED years
// are never editable — the row action that opens this is hidden for
// them, see row-actions.tsx) with the same three fields either way.
export function AcademicYearSheet({
  year,
  open,
  onOpenChange,
}: {
  year?: AcademicYear;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(year?.name ?? "");
  const [startDate, setStartDate] = useState(year?.startDate ?? "");
  const [endDate, setEndDate] = useState(year?.endDate ?? "");
  const isEdit = !!year;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? `${name} updated.` : `${name} created.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit academic year" : "New academic year"}</SheetTitle>
          <SheetDescription>
            Sessions can overlap by design — a new year can start before the previous one closes.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="ay-name">Name</FieldLabel>
            <Input id="ay-name" placeholder="2027-28" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ay-start">Start date</FieldLabel>
            <Input id="ay-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ay-end">End date</FieldLabel>
            <Input id="ay-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!name || !startDate || !endDate}>
            {isEdit ? "Save changes" : "Create year"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
