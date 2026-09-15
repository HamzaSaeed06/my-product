"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { FieldCategory } from "@/lib/mock/student-fields";

export function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: {
  category?: FieldCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const isEditing = !!category;

  function handleSave() {
    onSave(name.trim());
    onOpenChange(false);
    toast.success(isEditing ? "Category renamed." : `"${name.trim()}" category added.`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Rename category" : "Add category"}</DialogTitle>
          <DialogDescription>Groups related fields together on the student form.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Health"
            onKeyDown={(e) => e.key === "Enter" && name.trim() && handleSave()}
          />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? "Save" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
