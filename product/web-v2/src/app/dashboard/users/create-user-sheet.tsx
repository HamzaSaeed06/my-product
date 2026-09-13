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
import { Input } from "@/components/ui/input";

// No role is picked here — a brand-new user starts with zero roles and
// gets one granted afterward from "Manage roles," same as the real
// backend (create and role-assignment are two separate permission-gated
// actions, user.create vs user.edit).
export function CreateUserSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSave() {
    onOpenChange(false);
    toast.success(`${fullName} created. Assign a role to give them access.`);
    setFullName("");
    setEmail("");
    setPassword("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>New user</SheetTitle>
          <SheetDescription>They&apos;ll have no access until a role is assigned.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="usr-name">Full name</FieldLabel>
            <Input id="usr-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="usr-email">Email</FieldLabel>
            <Input id="usr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="usr-password">Temporary password</FieldLabel>
            <Input id="usr-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <FieldDescription>8+ characters with upper/lower case, a number, and a symbol.</FieldDescription>
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!fullName || !email || password.length < 8}>
            Create user
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
