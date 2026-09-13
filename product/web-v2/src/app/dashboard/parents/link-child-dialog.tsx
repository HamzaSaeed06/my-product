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
import type { Parent } from "@/lib/mock/parents";
import { mockStudents, type Student } from "@/lib/mock/students";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

// Explicit search-then-results, not live-filter-as-you-type: the student
// list can run into the thousands on a real deployment, so this searches
// on demand (Enter or the button, same as the button will later call a
// real search endpoint) rather than filtering a fully-loaded list
// client-side. The button's spinner is exactly what that real request's
// pending state will look like — worth getting right now, not bolting on
// later once the API call actually exists.
export function LinkChildDialog({
  parent,
  open,
  onOpenChange,
}: {
  parent: Parent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [relationship, setRelationship] = useState("");

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      const matches = mockStudents.filter(
        (s) =>
          s.status === "ACTIVE" &&
          !parent.children.some((c) => c.studentId === s.id) &&
          (s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(query.trim()))
      );
      setResults(matches);
      setSearching(false);
    }, 400);
  }

  function reset() {
    setQuery("");
    setResults(null);
    setSelected(null);
    setRelationship("");
  }

  function handleLink() {
    onOpenChange(false);
    toast.success(`${selected?.fullName} linked to ${parent.fullName}.`);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Link a child</DialogTitle>
          <DialogDescription>Search by name or admission number.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {selected ? (
            <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(selected.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{selected.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">{selected.admissionNo}</span>
                <span className="text-xs text-muted-foreground">
                  {selected.className}-{selected.section} · {selected.campusName}
                </span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)} aria-label="Change student">
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="link-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="link-search"
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
                        onClick={() => setSelected(s)}
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

          <Field>
            <FieldLabel htmlFor="link-relationship">Relationship</FieldLabel>
            <Input
              id="link-relationship"
              placeholder="Father / Mother / Guardian"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!selected} onClick={handleLink}>
            Link this student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
