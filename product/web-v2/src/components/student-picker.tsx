"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, UserPlus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockStudents, findPotentialDuplicateStudents, type Student } from "@/lib/mock/students";

export type StudentSelection =
  | { mode: "search"; student: Student }
  | { mode: "new"; fullName: string; dateOfBirth: string; bForm: string | null };

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

// Shared by "New admission" and "Convert inquiry" — both need the exact
// same existing/new choice and the exact same duplicate-check on the new-
// student form (name+DOB, or B-Form when given), so it lives here once
// rather than being reimplemented per flow.
export function StudentPicker({
  value,
  onChange,
  idPrefix,
  defaultName = "",
}: {
  value: StudentSelection | null;
  onChange: (value: StudentSelection | null) => void;
  idPrefix: string;
  defaultName?: string;
}) {
  const [mode, setMode] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);

  const [fullName, setFullName] = useState(defaultName);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bForm, setBForm] = useState("");

  const duplicates =
    mode === "new" && fullName.trim() && dateOfBirth
      ? findPotentialDuplicateStudents(fullName, dateOfBirth, bForm || null)
      : [];

  useEffect(() => {
    if (mode === "search") return;
    if (!fullName.trim() || !dateOfBirth) {
      onChange(null);
      return;
    }
    onChange({ mode: "new", fullName: fullName.trim(), dateOfBirth, bForm: bForm.trim() || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fullName, dateOfBirth, bForm]);

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      setResults(mockStudents.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(query.trim())));
      setSearching(false);
    }, 400);
  }

  function selectStudent(student: Student) {
    onChange({ mode: "search", student });
  }

  const selectedStudent = value?.mode === "search" ? value.student : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          variant={mode === "search" ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            setMode("search");
            onChange(null);
          }}
        >
          Existing student
        </Button>
        <Button
          variant={mode === "new" ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            setMode("new");
            onChange(null);
          }}
        >
          <UserPlus className="size-3.5" />
          New student
        </Button>
      </div>

      {mode === "search" ? (
        selectedStudent ? (
          <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(selectedStudent.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">{selectedStudent.fullName}</span>
              <span className="font-mono text-xs text-muted-foreground">{selectedStudent.admissionNo}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Change
            </Button>
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-student-search`}>Search students</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id={`${idPrefix}-student-search`}
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
                      onClick={() => selectStudent(s)}
                    >
                      <span className="font-medium text-foreground">{s.fullName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{s.admissionNo}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matching students — try &quot;New student&quot; instead.</p>
              )
            ) : null}
          </>
        )
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-student-name`}>Child&apos;s full name</FieldLabel>
            <Input id={`${idPrefix}-student-name`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-student-dob`}>Date of birth</FieldLabel>
              <Input id={`${idPrefix}-student-dob`} type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-student-bform`}>B-Form no. (optional)</FieldLabel>
              <Input
                id={`${idPrefix}-student-bform`}
                placeholder="e.g. 12345-1234567-1"
                value={bForm}
                onChange={(e) => setBForm(e.target.value)}
              />
            </Field>
          </div>
          {duplicates.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-[var(--card-radius)] border border-signal/40 bg-signal/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TriangleAlert className="size-3.5 shrink-0 text-signal" />
                Possible existing record found
              </div>
              {duplicates.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-[var(--card-radius)] bg-background/60 p-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{s.fullName}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.admissionNo} · DOB {s.dateOfBirth}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => selectStudent(s)}>
                    Use this student
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Not the same child? Ignore this and continue — the name/DOB match alone isn&apos;t a hard block.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
