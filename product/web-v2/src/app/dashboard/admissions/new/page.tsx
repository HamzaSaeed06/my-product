"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StepIndicator, type Step } from "@/components/step-indicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/combobox";
import { StudentPicker, type StudentSelection } from "@/components/student-picker";
import { ParentPicker, type ParentSelection } from "@/components/parent-picker";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";
import { mockAcademicYears } from "@/lib/mock/academic-years";

const STEPS: Step[] = [{ label: "Student" }, { label: "Parent" }, { label: "Placement" }, { label: "Review" }];

// A genuinely multi-step flow gets a dedicated route with a real step
// indicator, not a 4-field dialog crammed into one modal (which is what
// the old frontend did) — this is exactly the case the interaction-pattern
// rules call out by name. Steps stay in this one route/URL rather than
// each having its own URL segment, which would be a reasonable further
// refinement but isn't required for "not a modal."
//
// Same Student + Parent steps as Convert Inquiry, not a simpler "pick an
// existing student" search — a walk-in family with no prior inquiry is at
// least as likely to be a brand-new child as an already-known one, so
// this flow needs the same existing/new choice (and the same duplicate
// checks) on both, not just on the student.
export default function NewAdmissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [studentSelection, setStudentSelection] = useState<StudentSelection | null>(null);
  const [parentSelection, setParentSelection] = useState<ParentSelection | null>(null);

  const [campusId, setCampusId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(
    mockAcademicYears.find((y) => y.status === "ACTIVE")?.id ?? null
  );

  const campusOptions = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
  const classOptions = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
  const yearOptions = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

  const canAdvance =
    step === 0 ? !!studentSelection : step === 1 ? !!parentSelection : step === 2 ? !!campusId && !!classId && !!academicYearId : true;

  function handleSubmit() {
    const studentLabel = studentSelection?.mode === "search" ? studentSelection.student.fullName : studentSelection?.fullName;
    toast.success(`Admission submitted for ${studentLabel} — pending decision.`);
    router.push("/dashboard/admissions");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="New admission"
        description="Approving an admission does not create an enrollment — those are separate steps."
      />

      <StepIndicator steps={STEPS} current={step} />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {step === 0 ? <StudentPicker value={studentSelection} onChange={setStudentSelection} idPrefix="adm" /> : null}

          {step === 1 ? <ParentPicker value={parentSelection} onChange={setParentSelection} idPrefix="adm" /> : null}

          {step === 2 ? (
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

          {step === 3 ? (
            <div className="flex flex-col divide-y divide-border">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Student</span>
                <span className="font-medium text-foreground">
                  {studentSelection?.mode === "search" ? studentSelection.student.fullName : `${studentSelection?.fullName} (new)`}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Parent</span>
                <span className="font-medium text-foreground">
                  {parentSelection?.mode === "search" ? parentSelection.parent.fullName : `${parentSelection?.fullName} (new)`}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Campus</span>
                <span className="font-medium text-foreground">{mockCampuses.find((c) => c.id === campusId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium text-foreground">{mockClasses.find((c) => c.id === classId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Academic year</span>
                <span className="font-medium text-foreground">{mockAcademicYears.find((y) => y.id === academicYearId)?.name}</span>
              </div>
              <p className="pt-3 text-xs text-muted-foreground">
                Submitting creates the student and parent records if new, links them, and creates a Pending
                application — a decision (approve/reject) happens afterward from the Admissions list.
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
