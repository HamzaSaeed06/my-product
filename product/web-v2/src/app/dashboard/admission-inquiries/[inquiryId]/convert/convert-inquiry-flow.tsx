"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Loader2, ChevronLeft, ChevronRight, Check, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/combobox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AdmissionInquiry } from "@/lib/mock/admission-inquiries";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockParents, type Parent } from "@/lib/mock/parents";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";
import { mockAcademicYears } from "@/lib/mock/academic-years";

const STEPS: Step[] = [{ label: "Student" }, { label: "Parent" }, { label: "Placement" }, { label: "Review" }];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

// The heaviest action in this module on the real backend: resolve-or-
// create both the Student and the Parent (refusing a silent auto-merge on
// an identity conflict — not modeled here since this is mock data, but
// the two-lane "search existing / create new" choice on each of the first
// two steps is what that resolve-or-create decision looks like from the
// UI side), link them, then create the Admission — exactly the kind of
// multi-step, real-stakes flow this pattern exists for.
export function ConvertInquiryFlow({ inquiry }: { inquiry: AdmissionInquiry }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [studentMode, setStudentMode] = useState<"search" | "new">("search");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentSearching, setStudentSearching] = useState(false);
  const [studentResults, setStudentResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [newStudentName, setNewStudentName] = useState(inquiry.childName);

  const [parentMode, setParentMode] = useState<"search" | "new">("search");
  const [parentQuery, setParentQuery] = useState("");
  const [parentSearching, setParentSearching] = useState(false);
  const [parentResults, setParentResults] = useState<Parent[] | null>(null);
  const [parent, setParent] = useState<Parent | null>(null);
  const [newParentName, setNewParentName] = useState(inquiry.parentName);
  const [newParentPhone, setNewParentPhone] = useState(inquiry.parentPhone);

  const [campusId, setCampusId] = useState<string | null>(inquiry.campusId);
  const [classId, setClassId] = useState<string | null>(inquiry.classId);
  const [academicYearId, setAcademicYearId] = useState<string | null>(
    mockAcademicYears.find((y) => y.status === "ACTIVE")?.id ?? null
  );

  const campusOptions = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
  const classOptions = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
  const yearOptions = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

  function runStudentSearch() {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return;
    setStudentSearching(true);
    setTimeout(() => {
      setStudentResults(mockStudents.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(studentQuery.trim())));
      setStudentSearching(false);
    }, 400);
  }

  function runParentSearch() {
    const q = parentQuery.trim().toLowerCase();
    if (!q) return;
    setParentSearching(true);
    setTimeout(() => {
      setParentResults(mockParents.filter((p) => p.fullName.toLowerCase().includes(q) || p.phone.includes(parentQuery.trim())));
      setParentSearching(false);
    }, 400);
  }

  const studentReady = studentMode === "search" ? !!student : newStudentName.trim().length > 0;
  const parentReady = parentMode === "search" ? !!parent : newParentName.trim().length > 0 && newParentPhone.trim().length > 0;
  const canAdvance = step === 0 ? studentReady : step === 1 ? parentReady : step === 2 ? !!campusId && !!classId && !!academicYearId : true;

  function handleConvert() {
    const studentLabel = studentMode === "search" ? student?.fullName : newStudentName;
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
            <>
              <div className="flex gap-2">
                <Button variant={studentMode === "search" ? "secondary" : "outline"} size="sm" onClick={() => setStudentMode("search")}>
                  Existing student
                </Button>
                <Button variant={studentMode === "new" ? "secondary" : "outline"} size="sm" onClick={() => setStudentMode("new")}>
                  <UserPlus className="size-3.5" />
                  New student
                </Button>
              </div>

              {studentMode === "search" ? (
                student ? (
                  <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(student.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="conv-student-search">Search students</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="conv-student-search"
                          placeholder="Search name or admission no."
                          value={studentQuery}
                          onChange={(e) => setStudentQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && runStudentSearch()}
                        />
                        <Button variant="outline" size="icon" onClick={runStudentSearch} disabled={!studentQuery.trim() || studentSearching} aria-label="Search">
                          {studentSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                        </Button>
                      </div>
                    </Field>
                    {studentResults ? (
                      studentResults.length ? (
                        <div className="flex max-h-48 flex-col divide-y divide-border overflow-y-auto rounded-[var(--card-radius)] border border-border">
                          {studentResults.map((s) => (
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
                        <p className="text-sm text-muted-foreground">No matching students — try &quot;New student&quot; instead.</p>
                      )
                    ) : null}
                  </>
                )
              ) : (
                <Field>
                  <FieldLabel htmlFor="conv-student-new">Child&apos;s full name</FieldLabel>
                  <Input id="conv-student-new" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                </Field>
              )}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="flex gap-2">
                <Button variant={parentMode === "search" ? "secondary" : "outline"} size="sm" onClick={() => setParentMode("search")}>
                  Existing parent
                </Button>
                <Button variant={parentMode === "new" ? "secondary" : "outline"} size="sm" onClick={() => setParentMode("new")}>
                  <UserPlus className="size-3.5" />
                  New parent
                </Button>
              </div>

              {parentMode === "search" ? (
                parent ? (
                  <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(parent.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">{parent.fullName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{parent.phone}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setParent(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="conv-parent-search">Search parents</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="conv-parent-search"
                          placeholder="Search name or phone"
                          value={parentQuery}
                          onChange={(e) => setParentQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && runParentSearch()}
                        />
                        <Button variant="outline" size="icon" onClick={runParentSearch} disabled={!parentQuery.trim() || parentSearching} aria-label="Search">
                          {parentSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                        </Button>
                      </div>
                    </Field>
                    {parentResults ? (
                      parentResults.length ? (
                        <div className="flex max-h-48 flex-col divide-y divide-border overflow-y-auto rounded-[var(--card-radius)] border border-border">
                          {parentResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                              onClick={() => setParent(p)}
                            >
                              <span className="font-medium text-foreground">{p.fullName}</span>
                              <span className="font-mono text-xs text-muted-foreground">{p.phone}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No matching parents — try &quot;New parent&quot; instead.</p>
                      )
                    ) : null}
                  </>
                )
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="conv-parent-name">Full name</FieldLabel>
                    <Input id="conv-parent-name" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="conv-parent-phone">Phone</FieldLabel>
                    <Input id="conv-parent-phone" value={newParentPhone} onChange={(e) => setNewParentPhone(e.target.value)} />
                  </Field>
                </>
              )}
            </>
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
                  {studentMode === "search" ? student?.fullName : `${newStudentName} (new)`}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Parent</span>
                <span className="font-medium text-foreground">
                  {parentMode === "search" ? parent?.fullName : `${newParentName} (new)`}
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
