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
import type { CategoryIconKey, FieldCategory } from "@/lib/mock/student-fields";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "./category-icons";

export function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: {
  category?: FieldCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, icon: CategoryIconKey) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState<CategoryIconKey>(category?.icon ?? "info");
  const isEditing = !!category;

  function handleSave() {
    onSave(name.trim(), icon);
    onOpenChange(false);
    toast.success(isEditing ? "Category updated." : `"${name.trim()}" category added.`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "Add category"}</DialogTitle>
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
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? "Save" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
