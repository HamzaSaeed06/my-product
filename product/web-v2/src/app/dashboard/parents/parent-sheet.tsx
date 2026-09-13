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
import type { Parent } from "@/lib/mock/parents";

// Handles both create and edit, same as every other module's Sheet in
// this build. Linking/unlinking children stays out of this form — that's
// its own Popover in the table row, unchanged.
export function ParentSheet({
  parent,
  open,
  onOpenChange,
}: {
  parent?: Parent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fullName, setFullName] = useState(parent?.fullName ?? "");
  const [phone, setPhone] = useState(parent?.phone ?? "");
  const [email, setEmail] = useState(parent?.email ?? "");
  const [address, setAddress] = useState(parent?.address ?? "");
  const isEdit = !!parent;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? `${fullName} updated.` : `${fullName} added. Link their children next.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit parent / guardian" : "New parent / guardian"}</SheetTitle>
          <SheetDescription>Link their children from the table row afterward.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="par-name">Full name</FieldLabel>
            <Input id="par-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="par-phone">Phone</FieldLabel>
            <Input id="par-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="par-email">Email</FieldLabel>
            <Input id="par-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="par-address">Address</FieldLabel>
            <Input id="par-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!fullName || !phone}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
