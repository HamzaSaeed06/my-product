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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { mockFeeCategories } from "@/lib/mock/fee-categories";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import type { FeeFrequency } from "@/lib/mock/fee-structures";

const CATEGORY_OPTIONS = mockFeeCategories.filter((c) => !c.archivedAt).map((c) => ({ value: c.id, label: c.name }));
const CLASS_OPTIONS = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
const CAMPUS_OPTIONS = [{ value: "all", label: "All campuses" }, ...mockCampuses.map((c) => ({ value: c.id, label: c.name }))];

const FREQUENCY_LABEL: Record<FeeFrequency, string> = { MONTHLY: "Monthly", ANNUAL: "Annual", ONE_TIME: "One-time" };

export function StructureSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [campusId, setCampusId] = useState<string | null>("all");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FeeFrequency>("MONTHLY");
  const [effectiveFrom, setEffectiveFrom] = useState("2026-06-01");

  function reset() {
    setName("");
    setCategoryId(null);
    setClassId(null);
    setCampusId("all");
    setAmount("");
    setFrequency("MONTHLY");
    setEffectiveFrom("2026-06-01");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Create a fee structure</SheetTitle>
          <SheetDescription>A template for one class — assign it to individual students afterwards from Student Fees.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="fs-name">Name</FieldLabel>
            <Input id="fs-name" placeholder="e.g. Grade 3 Tuition" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Combobox options={CATEGORY_OPTIONS} value={categoryId} onChange={setCategoryId} placeholder="Select" />
            </Field>
            <Field>
              <FieldLabel>Class</FieldLabel>
              <Combobox options={CLASS_OPTIONS} value={classId} onChange={setClassId} placeholder="Select" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Campus</FieldLabel>
            <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="All campuses" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="fs-amount">Amount</FieldLabel>
              <Input id="fs-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Frequency</FieldLabel>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as FeeFrequency)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value) => FREQUENCY_LABEL[value as FeeFrequency]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABEL) as FeeFrequency[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FREQUENCY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="fs-effective">Effective from</FieldLabel>
            <Input id="fs-effective" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            disabled={!name.trim() || !categoryId || !classId || !amount}
            onClick={() => {
              onOpenChange(false);
              toast.success("Fee structure created.");
              reset();
            }}
          >
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
