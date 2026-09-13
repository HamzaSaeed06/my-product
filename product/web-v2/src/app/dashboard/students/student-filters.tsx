"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import type { FeeStatus, Student } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";
import { DataTable } from "@/components/data-table";
import { studentColumns } from "./columns";

const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
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

// Graduated students are not part of anyone's daily work — showing them
// mixed into the default roster is noise, not data. Default view excludes
// them; "Graduated" is one explicit filter choice away when someone
// actually needs that list (an alumni report, a transcript request).
type StatusFilter = "CURRENT" | "ACTIVE" | "INACTIVE" | "GRADUATED";
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "CURRENT", label: "Active & inactive" },
  { value: "ACTIVE", label: "Active only" },
  { value: "INACTIVE", label: "Inactive only" },
  { value: "GRADUATED", label: "Graduated" },
];

// The real operational question staff ask is compound — "this campus, this
// class, this section, who hasn't paid" — so every filter combines with AND
// logic in one pass, plus a name/admission-no search. This is what replaces
// the old build's single plain <Select>.
export function StudentFilters({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [feeFilter, setFeeFilter] = useState<FeeStatus | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("CURRENT");

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter === "CURRENT" && s.status === "GRADUATED") return false;
      if (statusFilter === "ACTIVE" && s.status !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && s.status !== "INACTIVE") return false;
      if (statusFilter === "GRADUATED" && s.status !== "GRADUATED") return false;
      if (campusFilter && s.campusId !== campusFilter) return false;
      if (classFilter && s.className !== classFilter) return false;
      if (sectionFilter && s.section !== sectionFilter) return false;
      if (feeFilter !== "ALL" && s.feeStatus !== feeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.fullName.toLowerCase().includes(q) && !s.admissionNo.includes(search)) return false;
      }
      return true;
    });
  }, [students, search, campusFilter, classFilter, sectionFilter, feeFilter, statusFilter]);

  const activeFilterCount = [
    campusFilter,
    classFilter,
    sectionFilter,
    feeFilter !== "ALL" ? feeFilter : null,
    statusFilter !== "CURRENT" ? statusFilter : null,
    search || null,
  ].filter(Boolean).length;

  function clearAll() {
    setSearch("");
    setCampusFilter(null);
    setClassFilter(null);
    setSectionFilter(null);
    setFeeFilter("ALL");
    setStatusFilter("CURRENT");
  }

  return (
    <DataTable
      columns={studentColumns}
      data={filtered}
      emptyTitle="No students match these filters"
      emptyDescription="Try a different campus, class, section, or fee status, or clear all filters."
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
            options={CAMPUS_OPTIONS}
            value={campusFilter}
            onChange={setCampusFilter}
            placeholder="Campus"
            searchPlaceholder="Search campus…"
            className="w-40"
          />
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
              <SelectValue>
                {(value: FeeStatus | "ALL") =>
                  value === "ALL" ? "All fee statuses" : FEE_STATUS_OPTIONS.find((o) => o.value === value)?.label
                }
              </SelectValue>
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue>{(value: StatusFilter) => STATUS_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
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
