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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldCategory, FieldDefinition, FieldType } from "@/lib/mock/student-fields";

const TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  DROPDOWN: "Dropdown",
  YES_NO: "Yes / No",
};

export function FieldSheet({
  field,
  categories,
  defaultCategoryId,
  open,
  onOpenChange,
  onSave,
}: {
  field?: FieldDefinition;
  categories: FieldCategory[];
  defaultCategoryId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: Omit<FieldDefinition, "id" | "order">) => void;
}) {
  const [label, setLabel] = useState(field?.label ?? "");
  const [categoryId, setCategoryId] = useState(field?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "");
  const [type, setType] = useState<FieldType>(field?.type ?? "TEXT");
  const [required, setRequired] = useState(field?.required ?? false);
  const [locked, setLocked] = useState(field?.locked ?? false);
  const [optionsText, setOptionsText] = useState(field?.options?.join("\n") ?? "");

  const isEditing = !!field;
  const canSave = label.trim().length > 0 && !!categoryId && (type !== "DROPDOWN" || optionsText.trim().length > 0);

  function handleSave() {
    onSave({
      label: label.trim(),
      categoryId,
      type,
      required,
      locked,
      options: type === "DROPDOWN" ? optionsText.split("\n").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    onOpenChange(false);
    toast.success(isEditing ? `"${label.trim()}" updated.` : `"${label.trim()}" added.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit field" : "Add field"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Changes apply the same way to every campus this field is visible on."
              : "New fields default to unlocked — a campus can hide or reorder them for itself."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="field-label">Label</FieldLabel>
            <Input id="field-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Blood Group" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => categories.find((c) => c.id === v)?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: FieldType) => TYPE_LABEL[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as FieldType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {type === "DROPDOWN" ? (
            <Field>
              <FieldLabel htmlFor="field-options">Options (one per line)</FieldLabel>
              <Textarea
                id="field-options"
                rows={4}
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"A+\nA-\nB+\n..."}
              />
            </Field>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={required} onCheckedChange={() => setRequired((v) => !v)} />
            Required
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={locked} onCheckedChange={() => setLocked((v) => !v)} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span>Locked institute-wide</span>
              <span className="text-xs text-muted-foreground">
                No campus can hide, reorder, or edit this field — every campus sees it exactly as defined here.
              </span>
            </span>
          </label>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? "Save changes" : "Add field"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
