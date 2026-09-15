"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, UserPlus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockParents, findParentByCnic, type Parent } from "@/lib/mock/parents";

export type ParentSelection =
  | { mode: "search"; parent: Parent }
  | { mode: "new"; fullName: string; phone: string; cnic: string };

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

// Same "Existing/New" + duplicate-check pattern as StudentPicker, but the
// duplicate check here is a hard, unambiguous match (CNIC is unique per
// adult) rather than a "possible" one — so as soon as a full CNIC is
// typed, the matching existing parent is surfaced as the obvious answer,
// not just a warning to weigh. This is what makes a second child from the
// same family land on the same Parent record instead of a duplicate one.
export function ParentPicker({
  value,
  onChange,
  idPrefix,
  defaultName = "",
  defaultPhone = "",
}: {
  value: ParentSelection | null;
  onChange: (value: ParentSelection | null) => void;
  idPrefix: string;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const [mode, setMode] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Parent[] | null>(null);

  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [cnic, setCnic] = useState("");

  const cnicMatch = mode === "new" ? findParentByCnic(cnic) : undefined;

  useEffect(() => {
    if (mode === "search") return;
    if (!fullName.trim() || !phone.trim() || !cnic.trim()) {
      onChange(null);
      return;
    }
    onChange({ mode: "new", fullName: fullName.trim(), phone: phone.trim(), cnic: cnic.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fullName, phone, cnic]);

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      setResults(mockParents.filter((p) => p.fullName.toLowerCase().includes(q) || p.phone.includes(query.trim())));
      setSearching(false);
    }, 400);
  }

  function selectParent(parent: Parent) {
    onChange({ mode: "search", parent });
  }

  const selectedParent = value?.mode === "search" ? value.parent : null;

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
          Existing parent
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
          New parent
        </Button>
      </div>

      {mode === "search" ? (
        selectedParent ? (
          <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(selectedParent.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">{selectedParent.fullName}</span>
              <span className="font-mono text-xs text-muted-foreground">{selectedParent.phone}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Change
            </Button>
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-parent-search`}>Search parents</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id={`${idPrefix}-parent-search`}
                  placeholder="Search name or phone"
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
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => selectParent(p)}
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
            <FieldLabel htmlFor={`${idPrefix}-parent-name`}>Full name</FieldLabel>
            <Input id={`${idPrefix}-parent-name`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-parent-phone`}>Phone</FieldLabel>
              <Input id={`${idPrefix}-parent-phone`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-parent-cnic`}>CNIC</FieldLabel>
              <Input
                id={`${idPrefix}-parent-cnic`}
                placeholder="e.g. 35202-1234567-1"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                aria-invalid={!!cnicMatch}
              />
            </Field>
          </div>
          {cnicMatch ? (
            <div className="flex items-center justify-between gap-3 rounded-[var(--card-radius)] border border-signal/40 bg-signal/10 p-3">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-signal" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">This CNIC already belongs to {cnicMatch.fullName}</span>
                  <span className="text-xs text-muted-foreground">Likely the same parent — link this child to them instead of creating a duplicate.</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => selectParent(cnicMatch)}>
                Use existing
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
