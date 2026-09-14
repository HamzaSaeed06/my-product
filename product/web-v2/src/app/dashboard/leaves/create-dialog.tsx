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
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { LeaveSubjectType } from "@/lib/mock/leaves";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const TEACHER_OPTIONS = mockTeachers.filter((t) => t.status === "ACTIVE").map((t) => ({ value: t.id, label: mockAppUsers.find((u) => u.id === t.userId)?.fullName ?? t.id }));

export function CreateLeaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [subjectType, setSubjectType] = useState<LeaveSubjectType>("STUDENT");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [fromDate, setFromDate] = useState("2026-09-16");
  const [toDate, setToDate] = useState("2026-09-16");
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
    setSubjectType("STUDENT");
    setTeacherId(null);
    setQuery("");
    setResults(null);
    setStudent(null);
    setFromDate("2026-09-16");
    setToDate("2026-09-16");
    setReason("");
  }

  const canSave = (subjectType === "STUDENT" ? !!student : !!teacherId) && !!reason.trim();

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
          <DialogTitle>Request leave</DialogTitle>
          <DialogDescription>A leave request in the past is marked retrospective automatically.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>For</FieldLabel>
            <Select
              value={subjectType}
              onValueChange={(v) => {
                setSubjectType(v as LeaveSubjectType);
                setStudent(null);
                setTeacherId(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(v) => (v === "STUDENT" ? "A student" : "A teacher")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">A student</SelectItem>
                <SelectItem value="TEACHER">A teacher</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {subjectType === "TEACHER" ? (
            <Field>
              <FieldLabel>Teacher</FieldLabel>
              <Combobox options={TEACHER_OPTIONS} value={teacherId} onChange={setTeacherId} placeholder="Select a teacher" />
            </Field>
          ) : student ? (
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
                <FieldLabel htmlFor="lv-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="lv-search"
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
              <FieldLabel htmlFor="lv-from">From</FieldLabel>
              <Input id="lv-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="lv-to">To</FieldLabel>
              <Input id="lv-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="lv-reason">Reason</FieldLabel>
            <Textarea id="lv-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!canSave}
            onClick={() => {
              onOpenChange(false);
              toast.success("Leave request submitted.");
              reset();
            }}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
