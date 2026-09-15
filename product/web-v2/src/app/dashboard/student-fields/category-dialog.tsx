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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryIconKey } from "@/lib/mock/student-fields";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "./category-icons";

// Add-only: a brand new category has no fields yet to manage, so a small
// Dialog for just name+icon is enough. Editing an existing category
// (which does have fields) uses the bigger CategorySheet instead, where
// those fields' lock/order/edit/delete live alongside the name/icon.
export function CategoryDialog({
  existingNames,
  open,
  onOpenChange,
  onSave,
}: {
  existingNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, icon: CategoryIconKey) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<CategoryIconKey>("info");

  const trimmed = name.trim();
  const isDuplicate = trimmed.length > 0 && existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  const canSave = trimmed.length > 0 && !isDuplicate;

  function handleSave() {
    if (!canSave) return;
    onSave(trimmed, icon);
    onOpenChange(false);
    toast.success(`"${trimmed}" category added.`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>Groups related fields together on the student form.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Health"
            aria-invalid={isDuplicate}
            onKeyDown={(e) => e.key === "Enter" && canSave && handleSave()}
          />
          {isDuplicate ? (
            <p className="text-xs text-destructive">A category named &quot;{trimmed}&quot; already exists.</p>
          ) : null}
        </Field>
        <Field>
          <FieldLabel>Icon</FieldLabel>
          <Select value={icon} onValueChange={(v) => setIcon(v as CategoryIconKey)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: CategoryIconKey) => (
                  <span className="flex items-center gap-2">
                    <CategoryIcon icon={v} className="size-4" />
                    {CATEGORY_ICON_OPTIONS.find((o) => o.value === v)?.label}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ICON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <CategoryIcon icon={opt.value} className="size-4" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={!canSave}>
            Add category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
