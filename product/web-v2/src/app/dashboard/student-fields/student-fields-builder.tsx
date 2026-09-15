"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/icon-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FieldSheet } from "./field-sheet";
import { CategoryDialog } from "./category-dialog";
import { CategorySheet } from "./category-sheet";
import { CategoryIcon } from "./category-icons";
import type { CategoryIconKey, FieldCategory, FieldDefinition, FieldType } from "@/lib/mock/student-fields";

const TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  DROPDOWN: "Dropdown",
  YES_NO: "Yes / No",
};

// Local-state CRUD (add/edit/delete/reorder), same pattern as Roles &
// Permissions and Feature Config's campus overrides — a real save happens
// against the backend in Phase C, mock data here just needs to feel like
// the finished interaction. Reordering is a simple move-up/down rather
// than drag-and-drop, since this list is always short per category and a
// new drag library is unwarranted for that.
//
// Field management (lock/reorder/edit/delete) lives entirely inside the
// "Edit category" Sheet, not scattered across this page too — per the
// user's explicit ask, everything about one category is in one place.
// This page shows a compact, read-only summary of each category's fields
// so it's still obvious what's inside without duplicating the controls.
export function StudentFieldsBuilder({
  initialCategories,
  initialFields,
}: {
  initialCategories: FieldCategory[];
  initialFields: FieldDefinition[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [fields, setFields] = useState(initialFields);

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FieldCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<FieldCategory | null>(null);
  const [fieldSheet, setFieldSheet] = useState<{ open: boolean; field?: FieldDefinition; categoryId?: string }>({ open: false });

  function addCategory(name: string, icon: CategoryIconKey) {
    setCategories((prev) => [...prev, { id: `cat_${Date.now()}`, name, icon, order: prev.length }]);
  }

  function saveCategory(categoryId: string, name: string, icon: CategoryIconKey) {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name, icon } : c)));
  }

  function deleteCategory(category: FieldCategory) {
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    setFields((prev) => prev.filter((f) => f.categoryId !== category.id));
  }

  function saveField(input: Omit<FieldDefinition, "id" | "order">) {
    if (fieldSheet.field) {
      setFields((prev) => prev.map((f) => (f.id === fieldSheet.field!.id ? { ...f, ...input } : f)));
    } else {
      const order = fields.filter((f) => f.categoryId === input.categoryId).length;
      setFields((prev) => [...prev, { ...input, id: `fld_${Date.now()}`, order }]);
    }
  }

  function toggleLock(field: FieldDefinition) {
    setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, locked: !f.locked } : f)));
  }

  function deleteField(field: FieldDefinition) {
    setFields((prev) => prev.filter((f) => f.id !== field.id));
  }

  function moveField(field: FieldDefinition, direction: -1 | 1) {
    setFields((prev) => {
      const siblings = prev.filter((f) => f.categoryId === field.categoryId).sort((a, b) => a.order - b.order);
      const index = siblings.findIndex((f) => f.id === field.id);
      const swapWith = siblings[index + direction];
      if (!swapWith) return prev;
      return prev.map((f) => {
        if (f.id === field.id) return { ...f, order: swapWith.order };
        if (f.id === swapWith.id) return { ...f, order: field.order };
        return f;
      });
    });
  }

  const sortedCategories = categories.slice().sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddCategoryOpen(true)}>
          <Plus className="size-3.5" />
          Add category
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedCategories.map((category) => {
          const categoryFields = fields.filter((f) => f.categoryId === category.id).sort((a, b) => a.order - b.order);
          return (
            <Card key={category.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CategoryIcon icon={category.icon} className="size-4 text-primary" />
                  {category.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <IconActionButton label="Edit category" onClick={() => setEditingCategory(category)}>
                    <Pencil className="size-3.5" />
                  </IconActionButton>
                  <IconActionButton label="Delete category" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 className="size-3.5" />
                  </IconActionButton>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {categoryFields.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">No fields in this category yet.</p>
                ) : (
                  categoryFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-medium text-foreground">{field.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {TYPE_LABEL[field.type]}
                          {field.required ? " · Required" : ""}
                        </span>
                      </div>
                      {field.locked ? (
                        <Lock className="size-3.5 shrink-0 text-destructive" aria-label="Locked institute-wide" />
                      ) : (
                        <LockOpen className="size-3.5 shrink-0 text-success" aria-label="Campus-editable" />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CategoryDialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen} onSave={addCategory} />

      {editingCategory ? (
        <CategorySheet
          key={editingCategory.id}
          category={editingCategory}
          fields={fields.filter((f) => f.categoryId === editingCategory.id)}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onSaveCategory={(name, icon) => saveCategory(editingCategory.id, name, icon)}
          onAddField={() => setFieldSheet({ open: true, categoryId: editingCategory.id })}
          onMoveField={moveField}
          onToggleLock={toggleLock}
          onEditField={(field) => setFieldSheet({ open: true, field })}
          onDeleteField={deleteField}
        />
      ) : null}

      <FieldSheet
        key={fieldSheet.field?.id ?? "new"}
        field={fieldSheet.field}
        defaultCategoryId={fieldSheet.categoryId}
        categories={sortedCategories}
        open={fieldSheet.open}
        onOpenChange={(open) => setFieldSheet((prev) => ({ ...prev, open }))}
        onSave={saveField}
      />
      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Delete category?"
        description={`"${categoryToDelete?.name}" and every field inside it will be removed from the student form.`}
        confirmLabel="Delete category"
        successMessage={`"${categoryToDelete?.name}" deleted.`}
        onConfirm={() => categoryToDelete && deleteCategory(categoryToDelete)}
      />
    </div>
  );
}
