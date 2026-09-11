"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createInvoice } from "./actions";

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
}
interface NamedOption {
  id: string;
  name: string;
}

interface ItemRow {
  feeCategoryId: string;
  description: string;
  amount: string;
}

export function CreateInvoiceDialog({ students, categories }: { students: StudentOption[]; categories: NamedOption[] }) {
  const disabled = students.length === 0 || categories.length === 0;
  const [items, setItems] = useState<ItemRow[]>([{ feeCategoryId: categories[0]?.id ?? "", description: "", amount: "" }]);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { feeCategoryId: categories[0]?.id ?? "", description: "", amount: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <FormDialog
      triggerLabel="+ Create invoice"
      title="Create an invoice"
      description={disabled ? "Need at least one student and one fee category first." : undefined}
      action={createInvoice}
    >
      <input type="hidden" name="itemsJson" value={JSON.stringify(items.filter((i) => i.feeCategoryId && i.description && i.amount))} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="inv-student">Student</Label>
        <Select name="studentId" disabled={disabled}>
          <SelectTrigger id="inv-student" className="w-full">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="inv-due">Due date</Label>
        <Input id="inv-due" name="dueDate" type="date" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Line items</Label>
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
            <Select value={item.feeCategoryId} onValueChange={(v) => v && updateItem(index, { feeCategoryId: v })} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
            />
            <Input
              placeholder="Amount"
              className="w-28"
              value={item.amount}
              onChange={(e) => updateItem(index, { amount: e.target.value })}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-1 self-start">
          + Add item
        </Button>
      </div>

      <p className="text-sm font-medium text-foreground">Total: {total.toFixed(2)}</p>
    </FormDialog>
  );
}
