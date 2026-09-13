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
import type { SchoolClass } from "@/lib/mock/classes";

export function ClassSheet({
  schoolClass,
  open,
  onOpenChange,
}: {
  schoolClass?: SchoolClass;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(schoolClass?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(schoolClass?.sortOrder ?? ""));
  const isEdit = !!schoolClass;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? `${name} updated.` : `${name} added to the catalog.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit class" : "New class"}</SheetTitle>
          <SheetDescription>
            Institute-wide catalog entry — campus-agnostic. It becomes a concrete offering once a Section
            is created for it at a campus and academic year.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="cls-name">Name</FieldLabel>
            <Input id="cls-name" placeholder="Grade 9" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="cls-sort">Sort order</FieldLabel>
            <Input id="cls-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!name}>
            {isEdit ? "Save changes" : "Create class"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
