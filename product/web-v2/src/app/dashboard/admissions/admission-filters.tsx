"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { DataTable } from "@/components/data-table";
import type { Admission, AdmissionStatus } from "@/lib/mock/admissions";
import { mockCampuses } from "@/lib/mock/campuses";
import { admissionColumns } from "./columns";

const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
const STATUS_OPTIONS: { value: AdmissionStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export function AdmissionFilters({ admissions }: { admissions: Admission[] }) {
  const [campusFilter, setCampusFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    return admissions.filter((a) => {
      if (campusFilter && a.campusId !== campusFilter) return false;
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      return true;
    });
  }, [admissions, campusFilter, statusFilter]);

  const activeCount = [campusFilter, statusFilter !== "ALL" ? statusFilter : null].filter(Boolean).length;

  return (
    <DataTable
      columns={admissionColumns}
      data={filtered}
      emptyTitle="No admissions match these filters"
      emptyDescription="Try a different campus or status, or clear all filters."
      toolbar={
        <>
          <Combobox options={CAMPUS_OPTIONS} value={campusFilter} onChange={setCampusFilter} placeholder="Campus" className="w-40" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as AdmissionStatus | "ALL") ?? "ALL")}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: AdmissionStatus | "ALL") =>
                  value === "ALL" ? "All statuses" : STATUS_OPTIONS.find((o) => o.value === value)?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => {
                setCampusFilter(null);
                setStatusFilter("ALL");
              }}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {admissions.length}
          </span>
        </>
      }
    />
  );
}
