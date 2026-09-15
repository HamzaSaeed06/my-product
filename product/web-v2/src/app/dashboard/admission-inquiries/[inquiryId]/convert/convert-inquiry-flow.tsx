"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StepIndicator, type Step } from "@/components/step-indicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/combobox";
import { StudentPicker, type StudentSelection } from "@/components/student-picker";
import { ParentPicker, type ParentSelection } from "@/components/parent-picker";
import type { AdmissionInquiry } from "@/lib/mock/admission-inquiries";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";
import { mockAcademicYears } from "@/lib/mock/academic-years";

const STEPS: Step[] = [{ label: "Student" }, { label: "Parent" }, { label: "Placement" }, { label: "Review" }];

// The heaviest action in this module on the real backend: resolve-or-
// create both the Student and the Parent (refusing a silent auto-merge on
// an identity conflict — StudentPicker/ParentPicker surface a possible
// match and let the office staff decide, never auto-merge), link them,
// then create the Admission — exactly the kind of multi-step, real-stakes
// flow this pattern exists for.
export function ConvertInquiryFlow({ inquiry }: { inquiry: AdmissionInquiry }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [studentSelection, setStudentSelection] = useState<StudentSelection | null>(null);
  const [parentSelection, setParentSelection] = useState<ParentSelection | null>(null);

  const [campusId, setCampusId] = useState<string | null>(inquiry.campusId);
  const [classId, setClassId] = useState<string | null>(inquiry.classId);
  const [academicYearId, setAcademicYearId] = useState<string | null>(
    mockAcademicYears.find((y) => y.status === "ACTIVE")?.id ?? null
  );

  const campusOptions = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
  const classOptions = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
  const yearOptions = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

  const canAdvance =
    step === 0 ? !!studentSelection : step === 1 ? !!parentSelection : step === 2 ? !!campusId && !!classId && !!academicYearId : true;

  function handleConvert() {
    const studentLabel = studentSelection?.mode === "search" ? studentSelection.student.fullName : studentSelection?.fullName;
    toast.success(`${inquiry.childName}'s inquiry converted — ${studentLabel} admitted, pending decision.`);
    router.push("/dashboard/admission-inquiries");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard/admission-inquiries" />}>Admission Inquiries</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Convert {inquiry.childName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-xl font-[450] text-foreground">Convert inquiry</h1>
        <p className="text-sm text-muted-foreground">
          {inquiry.childName} · {inquiry.parentName} · logged {inquiry.createdAt}
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {step === 0 ? (
            <StudentPicker value={studentSelection} onChange={setStudentSelection} idPrefix="conv" defaultName={inquiry.childName} />
          ) : null}

          {step === 1 ? (
            <ParentPicker
              value={parentSelection}
              onChange={setParentSelection}
              idPrefix="conv"
              defaultName={inquiry.parentName}
              defaultPhone={inquiry.parentPhone}
            />
          ) : null}

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
                Converting creates the student and parent records if new, links them, creates a Pending admission,
                and marks this inquiry Converted — a decision on the admission still happens separately afterward.
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
          <Button onClick={handleConvert}>
            <Check className="size-3.5" />
            Convert
          </Button>
        )}
      </div>
    </div>
  );
}
