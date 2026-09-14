"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockFeeStructures } from "@/lib/mock/fee-structures";
import type { DiscountType } from "@/lib/mock/discounts";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const TYPE_LABEL: Record<DiscountType, string> = { SIBLING: "Sibling", MERIT: "Merit", STAFF: "Staff", OTHER: "Other" };
const STRUCTURE_OPTIONS = [
  { value: "wide", label: "Student-wide (every fee)" },
  ...mockFeeStructures.filter((s) => !s.archivedAt).map((s) => ({ value: s.id, label: s.name })),
];

export function RequestDiscountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [structureId, setStructureId] = useState<string | null>("wide");
  const [type, setType] = useState<DiscountType>("SIBLING");
  const [mode, setMode] = useState<"percentage" | "amount">("percentage");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      setResults(mockStudents.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(query.trim())));
      setSearching(false);
    }, 400);
  }

  function reset() {
    setQuery("");
    setResults(null);
    setStudent(null);
    setStructureId("wide");
    setType("SIBLING");
    setMode("percentage");
    setValue("");
    setReason("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a discount</DialogTitle>
          <DialogDescription>Reduces what future invoices should charge — needs approval before it takes effect.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
                <FieldLabel htmlFor="disc-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="disc-search"
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

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Applies to</FieldLabel>
              <Combobox options={STRUCTURE_OPTIONS} value={structureId} onChange={setStructureId} placeholder="Select" />
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as DiscountType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => TYPE_LABEL[v as DiscountType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as DiscountType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Discount as</FieldLabel>
              <Select value={mode} onValueChange={(v) => setMode(v as "percentage" | "amount")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => (v === "percentage" ? "Percentage" : "Fixed amount")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="amount">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="disc-value">{mode === "percentage" ? "Percentage" : "Amount (Rs)"}</FieldLabel>
              <Input id="disc-value" type="number" min={0} max={mode === "percentage" ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="disc-reason">Reason</FieldLabel>
            <Textarea id="disc-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!student || !value || !reason.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Discount request sent for approval.");
              reset();
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
