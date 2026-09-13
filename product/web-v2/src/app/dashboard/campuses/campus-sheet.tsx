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
import type { CampusOverview } from "@/lib/mock/campuses";

export function CampusSheet({
  campus,
  open,
  onOpenChange,
}: {
  campus?: Pick<CampusOverview, "id" | "name" | "address" | "phone">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(campus?.name ?? "");
  const [address, setAddress] = useState(campus?.address ?? "");
  const [phone, setPhone] = useState(campus?.phone ?? "");
  const isEdit = !!campus;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? `${name} updated.` : `${name} created.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit campus" : "New campus"}</SheetTitle>
          <SheetDescription>Assigning a Campus Head happens from the Users module once they exist.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="cmp-name">Name</FieldLabel>
            <Input id="cmp-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="cmp-address">Address</FieldLabel>
            <Input id="cmp-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="cmp-phone">Phone</FieldLabel>
            <Input id="cmp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!name}>
            {isEdit ? "Save changes" : "Create campus"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
