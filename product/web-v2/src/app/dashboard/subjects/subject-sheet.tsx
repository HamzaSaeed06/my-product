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
import type { Subject } from "@/lib/mock/subjects";

export function SubjectSheet({
  subject,
  open,
  onOpenChange,
}: {
  subject?: Subject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.code ?? "");
  const isEdit = !!subject;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? `${name} updated.` : `${name} added to the catalog.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit subject" : "New subject"}</SheetTitle>
          <SheetDescription>Institute-wide catalog — no campus scoping.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="sub-name">Name</FieldLabel>
            <Input id="sub-name" placeholder="Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sub-code">Code</FieldLabel>
            <Input id="sub-code" placeholder="MATH" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!name}>
            {isEdit ? "Save changes" : "Create subject"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
