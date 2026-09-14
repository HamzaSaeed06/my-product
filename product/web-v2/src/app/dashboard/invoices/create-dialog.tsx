"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, X, Plus, Trash2 } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockFeeCategories } from "@/lib/mock/fee-categories";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const CATEGORY_OPTIONS = mockFeeCategories.filter((c) => !c.archivedAt).map((c) => ({ value: c.id, label: c.name }));

interface DraftItem {
  id: string;
  feeCategoryId: string | null;
  description: string;
  amount: string;
}

function emptyItem(): DraftItem {
  return { id: `item_${Math.random()}`, feeCategoryId: null, description: "", amount: "" };
}

export function CreateInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [dueDate, setDueDate] = useState("2026-10-10");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      setResults(mockStudents.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(query.trim())));
      setSearching(false);
    }, 400);
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function reset() {
    setQuery("");
    setResults(null);
    setStudent(null);
    setDueDate("2026-10-10");
    setItems([emptyItem()]);
  }

  const canSave = student && items.length > 0 && items.every((i) => i.feeCategoryId && i.description.trim() && Number(i.amount) > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create an invoice</DialogTitle>
          <DialogDescription>Line items reference a fee category directly — add one row per charge.</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {student ? (
            <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(student.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setStudent(null)} aria-label="Change student">
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="inv-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="inv-search"
                    placeholder="Search name or admission no."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  />
                  <Button variant="outline" size="icon" onClick={runSearch} disabled={!query.trim() || searching} aria-label="Search">
                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  </Button>
                </div>
              </Field>
              {results ? (
                results.length ? (
                  <div className="flex max-h-40 flex-col divide-y divide-border overflow-y-auto rounded-[var(--card-radius)] border border-border">
                    {results.map((s) => (
                      <button key={s.id} type="button" className="flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => setStudent(s)}>
                        <span className="font-medium text-foreground">{s.fullName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{s.admissionNo}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No matching students found.</p>
                )
              ) : null}
            </>
          )}

          <Field>
            <FieldLabel htmlFor="inv-due">Due date</FieldLabel>
            <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>

          <div className="flex flex-col gap-2">
            <FieldLabel>Line items</FieldLabel>
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <Combobox options={CATEGORY_OPTIONS} value={item.feeCategoryId} onChange={(v) => updateItem(item.id, { feeCategoryId: v })} placeholder="Category" className="w-36" />
                <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} className="flex-1" />
                <Input type="number" min={0} placeholder="Amount" value={item.amount} onChange={(e) => updateItem(item.id, { amount: e.target.value })} className="w-28" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                  disabled={items.length === 1}
                  aria-label="Remove row"
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="self-start" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
              <Plus className="size-3.5" />
              Add line
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-[var(--card-radius)] bg-muted/40 px-3 py-2">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="font-mono text-sm font-medium text-foreground">Rs {total.toLocaleString()}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!canSave}
            onClick={() => {
              onOpenChange(false);
              toast.success(`Invoice created for ${student?.fullName}.`);
              reset();
            }}
          >
            Create invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
