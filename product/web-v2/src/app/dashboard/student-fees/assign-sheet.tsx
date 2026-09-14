"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, X } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockFeeStructures } from "@/lib/mock/fee-structures";
import { mockFeeCategories } from "@/lib/mock/fee-categories";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const STRUCTURE_OPTIONS = mockFeeStructures
  .filter((s) => !s.archivedAt)
  .map((s) => ({ value: s.id, label: `${s.name} — Rs ${s.amount.toLocaleString()} (${mockFeeCategories.find((c) => c.id === s.feeCategoryId)?.name})` }));

export function AssignFeeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [structureId, setStructureId] = useState<string | null>(null);
  const [overrideAmount, setOverrideAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("2026-06-01");

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
    setStructureId(null);
    setOverrideAmount("");
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
          <SheetTitle>Assign a fee structure</SheetTitle>
          <SheetDescription>Attaches a template to one student — this is what actually charges them.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
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
                <FieldLabel htmlFor="sf-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="sf-search"
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
                  <div className="flex max-h-48 flex-col divide-y divide-border overflow-y-auto rounded-[var(--card-radius)] border border-border">
                    {results.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => setStudent(s)}
                      >
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
            <FieldLabel>Fee structure</FieldLabel>
            <Combobox options={STRUCTURE_OPTIONS} value={structureId} onChange={setStructureId} placeholder="Select a structure" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sf-override">Override amount (optional)</FieldLabel>
            <Input id="sf-override" type="number" min={0} placeholder="Use the structure's own amount" value={overrideAmount} onChange={(e) => setOverrideAmount(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sf-effective">Effective from</FieldLabel>
            <Input id="sf-effective" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            disabled={!student || !structureId}
            onClick={() => {
              onOpenChange(false);
              toast.success(`Fee structure assigned to ${student?.fullName}.`);
              reset();
            }}
          >
            Assign
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
