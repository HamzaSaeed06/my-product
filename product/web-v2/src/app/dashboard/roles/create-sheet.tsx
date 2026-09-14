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

export function CreateRoleSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setName("");
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create a custom role</SheetTitle>
          <SheetDescription>A pure permission bag — no systemKey, unlike the 7 built-in roles. Set its permissions afterwards.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 py-2">
          <Field>
            <FieldLabel htmlFor="role-name">Name</FieldLabel>
            <Input id="role-name" placeholder="e.g. Exam Coordinator" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Role created — set its permissions next.");
              setName("");
            }}
          >
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
