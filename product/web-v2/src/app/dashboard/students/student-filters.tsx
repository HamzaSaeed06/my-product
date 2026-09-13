"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import type { FeeStatus, Student } from "@/lib/mock/students";
import { DataTable } from "@/components/data-table";
import { studentColumns } from "./columns";

const CLASS_OPTIONS = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].map((c) => ({
  value: c,
  label: c,
}));
const SECTION_OPTIONS = ["A", "B", "C"];
const FEE_STATUS_OPTIONS: { value: FeeStatus; label: string }[] = [
  { value: "PAID", label: "Paid" },
  { value: "DUE", label: "Due" },
  { value: "OVERDUE", label: "Overdue" },
];

// The real operational question staff ask is compound — "this class, this
// section, who hasn't paid" — so class, section, and fee status all combine
// with AND logic in one pass, plus a name/admission-no search. This is what
// replaces the old build's single plain <Select>.
export function StudentFilters({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [feeFilter, setFeeFilter] = useState<FeeStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter && s.className !== classFilter) return false;
      if (sectionFilter && s.section !== sectionFilter) return false;
      if (feeFilter !== "ALL" && s.feeStatus !== feeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.fullName.toLowerCase().includes(q) && !s.admissionNo.includes(search)) return false;
      }
      return true;
    });
  }, [students, search, classFilter, sectionFilter, feeFilter]);

  const activeFilterCount = [classFilter, sectionFilter, feeFilter !== "ALL" ? feeFilter : null, search || null].filter(
    Boolean
  ).length;

  function clearAll() {
    setSearch("");
    setClassFilter(null);
    setSectionFilter(null);
    setFeeFilter("ALL");
  }

  return (
    <DataTable
      columns={studentColumns}
      data={filtered}
      emptyTitle="No students match these filters"
      emptyDescription="Try a different class, section, or fee status, or clear all filters."
      toolbar={
        <>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or admission no."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Combobox
            options={CLASS_OPTIONS}
            value={classFilter}
            onChange={setClassFilter}
            placeholder="Class"
            searchPlaceholder="Search class…"
            className="w-36"
          />
          <Combobox
            options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
            value={sectionFilter}
            onChange={setSectionFilter}
            placeholder="Section"
            searchPlaceholder="Search section…"
            className="w-36"
          />
          <Select value={feeFilter} onValueChange={(v) => setFeeFilter(v as FeeStatus | "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Fee status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All fee statuses</SelectItem>
              {FEE_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilterCount > 0 ? (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearAll}>
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {students.length}
          </span>
        </>
      }
    />
  );
}
