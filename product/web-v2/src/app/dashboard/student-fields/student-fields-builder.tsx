"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FieldRow } from "./field-row";
import { FieldSheet } from "./field-sheet";
import { CategoryDialog } from "./category-dialog";
import type { FieldCategory, FieldDefinition } from "@/lib/mock/student-fields";

// Local-state CRUD (add/edit/delete/reorder), same pattern as Roles &
// Permissions and Feature Config's campus overrides — a real save happens
// against the backend in Phase C, mock data here just needs to feel like
// the finished interaction. Reordering is a simple move-up/down rather
// than drag-and-drop, since this list is always short per category and a
// new drag library is unwarranted for that.
export function StudentFieldsBuilder({
  initialCategories,
  initialFields,
}: {
  initialCategories: FieldCategory[];
  initialFields: FieldDefinition[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [fields, setFields] = useState(initialFields);

  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category?: FieldCategory }>({ open: false });
  const [categoryToDelete, setCategoryToDelete] = useState<FieldCategory | null>(null);
  const [fieldSheet, setFieldSheet] = useState<{ open: boolean; field?: FieldDefinition; categoryId?: string }>({ open: false });

  function saveCategory(name: string) {
    if (categoryDialog.category) {
      setCategories((prev) => prev.map((c) => (c.id === categoryDialog.category!.id ? { ...c, name } : c)));
    } else {
      setCategories((prev) => [...prev, { id: `cat_${Date.now()}`, name, order: prev.length }]);
    }
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
        <Button size="sm" onClick={() => setCategoryDialog({ open: true })}>
          <Plus className="size-3.5" />
          Add category
        </Button>
      </div>

      {sortedCategories.map((category) => {
        const categoryFields = fields.filter((f) => f.categoryId === category.id).sort((a, b) => a.order - b.order);
        return (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{category.name}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setCategoryDialog({ open: true, category })} aria-label="Rename category">
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setCategoryToDelete(category)} aria-label="Delete category">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {categoryFields.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No fields in this category yet.</p>
              ) : (
                categoryFields.map((field, index) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    canMoveUp={index > 0}
                    canMoveDown={index < categoryFields.length - 1}
                    onMoveUp={() => moveField(field, -1)}
                    onMoveDown={() => moveField(field, 1)}
                    onToggleLock={() => toggleLock(field)}
                    onEdit={() => setFieldSheet({ open: true, field })}
                    onDelete={() => deleteField(field)}
                  />
                ))
              )}
              <div>
                <Button variant="outline" size="sm" onClick={() => setFieldSheet({ open: true, categoryId: category.id })}>
                  <Plus className="size-3.5" />
                  Add field
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <CategoryDialog
        key={categoryDialog.category?.id ?? "new"}
        category={categoryDialog.category}
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog((prev) => ({ ...prev, open }))}
        onSave={saveCategory}
      />
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
