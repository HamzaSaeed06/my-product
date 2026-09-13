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
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => {
    const className = mockClasses.find((c) => c.id === s.classId)?.name;
    const campusName = mockCampuses.find((c) => c.id === s.campusId)?.name;
    const yearName = mockAcademicYears.find((y) => y.id === s.academicYearId)?.name;
    return { value: s.id, label: `${className} ${s.name} · ${campusName} · ${yearName}` };
  });

export function EnrollSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [rollNumber, setRollNumber] = useState("");

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
    setSectionId(null);
    setRollNumber("");
  }

  function handleSave() {
    onOpenChange(false);
    toast.success(`${student?.fullName} enrolled.`);
    reset();
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
          <SheetTitle>Enroll a student</SheetTitle>
          <SheetDescription>Places an already-admitted student into a section for an academic year.</SheetDescription>
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
                <FieldLabel htmlFor="enr-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="enr-search"
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
            <FieldLabel>Section</FieldLabel>
            <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select a section" />
          </Field>
          <Field>
            <FieldLabel htmlFor="enr-roll">Roll number (optional)</FieldLabel>
            <Input id="enr-roll" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!student || !sectionId}>
            Enroll
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
