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
import { Combobox } from "@/components/combobox";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const CATEGORY_OPTIONS = [
  { value: "Bullying", label: "Bullying" },
  { value: "Academic", label: "Academic" },
  { value: "Facilities", label: "Facilities" },
  { value: "Behavioral", label: "Behavioral" },
  { value: "Other", label: "Other" },
];
const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));

export function CreateComplaintDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isGeneral, setIsGeneral] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [campusId, setCampusId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");

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
    setIsGeneral(false);
    setQuery("");
    setResults(null);
    setStudent(null);
    setCampusId(null);
    setCategory(null);
    setDescription("");
  }

  const canSave = (isGeneral ? !!campusId : !!student) && !!category && !!description.trim();

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
          <DialogTitle>Log a complaint</DialogTitle>
          <DialogDescription>Campus is required — derived from the student&apos;s campus, or picked directly for a general complaint.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button type="button" variant={!isGeneral ? "default" : "outline"} size="sm" onClick={() => setIsGeneral(false)}>
              About a student
            </Button>
            <Button type="button" variant={isGeneral ? "default" : "outline"} size="sm" onClick={() => setIsGeneral(true)}>
              General complaint
            </Button>
          </div>

          {isGeneral ? (
            <Field>
              <FieldLabel>Campus</FieldLabel>
              <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="Select a campus" />
            </Field>
          ) : student ? (
            <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(student.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">{student.admissionNo} · {student.campusName}</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setStudent(null)} aria-label="Change student">
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="cmp-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="cmp-search"
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
            <FieldLabel>Category</FieldLabel>
            <Combobox options={CATEGORY_OPTIONS} value={category} onChange={setCategory} placeholder="Select a category" />
          </Field>
          <Field>
            <FieldLabel htmlFor="cmp-desc">Description</FieldLabel>
            <Textarea id="cmp-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!canSave}
            onClick={() => {
              onOpenChange(false);
              toast.success("Complaint logged.");
              reset();
            }}
          >
            Log complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
