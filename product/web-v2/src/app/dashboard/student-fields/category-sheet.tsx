"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryIconKey, FieldCategory, FieldDefinition } from "@/lib/mock/student-fields";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "./category-icons";
import { FieldRow } from "./field-row";

// Everything about one category in one place, per the user's explicit
// request: name/icon at top, then every field inside it with its own
// lock/reorder/edit/delete controls, and "+ Add field" — rather than the
// name/icon living in a small Dialog while field management happened
// separately on the main page.
export function CategorySheet({
  category,
  fields,
  open,
  onOpenChange,
  onSaveCategory,
  onAddField,
  onMoveField,
  onToggleLock,
  onEditField,
  onDeleteField,
}: {
  category: FieldCategory;
  fields: FieldDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveCategory: (name: string, icon: CategoryIconKey) => void;
  onAddField: () => void;
  onMoveField: (field: FieldDefinition, direction: -1 | 1) => void;
  onToggleLock: (field: FieldDefinition) => void;
  onEditField: (field: FieldDefinition) => void;
  onDeleteField: (field: FieldDefinition) => void;
}) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState<CategoryIconKey>(category.icon);

  function handleSave() {
    onSaveCategory(name.trim(), icon);
    onOpenChange(false);
    toast.success("Category updated.");
  }

  const sortedFields = fields.slice().sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Edit category</SheetTitle>
          <SheetDescription>Update the category itself, or manage the fields inside it below.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="category-sheet-name">Name</FieldLabel>
              <Input id="category-sheet-name" value={name} onChange={(e) => setName(e.target.value)} />
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
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Fields in this category</span>
            {sortedFields.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No fields yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sortedFields.map((field, index) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedFields.length - 1}
                    onMoveUp={() => onMoveField(field, -1)}
                    onMoveDown={() => onMoveField(field, 1)}
                    onToggleLock={() => onToggleLock(field)}
                    onEdit={() => onEditField(field)}
                    onDelete={() => onDeleteField(field)}
                  />
                ))}
              </div>
            )}
            <div>
              <Button variant="outline" size="sm" onClick={onAddField}>
                <Plus className="size-3.5" />
                Add field
              </Button>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
