"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StepIndicator, type Step } from "@/components/step-indicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/combobox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";
import { mockAcademicYears } from "@/lib/mock/academic-years";

const STEPS: Step[] = [{ label: "Applicant" }, { label: "Placement" }, { label: "Review" }];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

// A genuinely multi-step flow gets a dedicated route with a real step
// indicator, not a 4-field dialog crammed into one modal (which is what
// the old frontend did) — this is exactly the case the interaction-pattern
// rules call out by name. Steps stay in this one route/URL rather than
// each having its own URL segment, which would be a reasonable further
// refinement but isn't required for "not a modal."
export default function NewAdmissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const [campusId, setCampusId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(
    mockAcademicYears.find((y) => y.status === "ACTIVE")?.id ?? null
  );

  const campusOptions = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
  const classOptions = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
  const yearOptions = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

  const campusName = useMemo(() => mockCampuses.find((c) => c.id === campusId)?.name, [campusId]);
  const className = useMemo(() => mockClasses.find((c) => c.id === classId)?.name, [classId]);
  const yearName = useMemo(() => mockAcademicYears.find((y) => y.id === academicYearId)?.name, [academicYearId]);

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      setResults(
        mockStudents.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(query.trim()))
      );
      setSearching(false);
    }, 400);
  }

  function handleSubmit() {
    toast.success(`Admission submitted for ${student?.fullName} — pending decision.`);
    router.push("/dashboard/admissions");
  }

  const canAdvance = step === 0 ? !!student : step === 1 ? !!campusId && !!classId && !!academicYearId : true;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="New admission" description="A student already needs to exist — this records an application for them." />

      <StepIndicator steps={STEPS} current={step} />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {step === 0 ? (
            <>
              {student ? (
                <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(student.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
                    <span className="text-xs text-muted-foreground">
                      {student.className}-{student.section} · {student.campusName}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="adm-search">Student</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="adm-search"
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
                      <div className="flex max-h-56 flex-col divide-y divide-border overflow-y-auto rounded-[var(--card-radius)] border border-border">
                        {results.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => setStudent(s)}
                          >
                            <span className="font-medium text-foreground">{s.fullName}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {s.admissionNo} · {s.className}-{s.section} · {s.campusName}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No matching students found.</p>
                    )
                  ) : null}
                </>
              )}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Field>
                <FieldLabel>Campus</FieldLabel>
                <Combobox options={campusOptions} value={campusId} onChange={setCampusId} placeholder="Select a campus" />
              </Field>
              <Field>
                <FieldLabel>Class</FieldLabel>
                <Combobox options={classOptions} value={classId} onChange={setClassId} placeholder="Select a class" />
              </Field>
              <Field>
                <FieldLabel>Academic year</FieldLabel>
                <Combobox options={yearOptions} value={academicYearId} onChange={setAcademicYearId} placeholder="Select a year" />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col divide-y divide-border">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Applicant</span>
                <span className="font-medium text-foreground">{student?.fullName}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Campus</span>
                <span className="font-medium text-foreground">{campusName}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium text-foreground">{className}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Academic year</span>
                <span className="font-medium text-foreground">{yearName}</span>
              </div>
              <p className="pt-3 text-xs text-muted-foreground">
                Submitting creates a Pending application — a decision (approve/reject) happens afterward from the
                Admissions list.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="size-3.5" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            <Check className="size-3.5" />
            Submit application
          </Button>
        )}
      </div>
    </div>
  );
}
