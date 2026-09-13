"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/combobox";
import { DataTable } from "@/components/data-table";
import type { Section } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { sectionColumns } from "./columns";

const CLASS_OPTIONS = mockClasses.map((c) => ({ value: c.id, label: c.name }));
const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
const YEAR_OPTIONS = mockAcademicYears.map((y) => ({ value: y.id, label: y.name }));

export function SectionFilters({ sections }: { sections: Section[] }) {
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [campusFilter, setCampusFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string | null>(
    mockAcademicYears.find((y) => y.status === "ACTIVE")?.id ?? null
  );

  const filtered = useMemo(() => {
    return sections.filter((s) => {
      if (classFilter && s.classId !== classFilter) return false;
      if (campusFilter && s.campusId !== campusFilter) return false;
      if (yearFilter && s.academicYearId !== yearFilter) return false;
      return true;
    });
  }, [sections, classFilter, campusFilter, yearFilter]);

  const activeCount = [classFilter, campusFilter].filter(Boolean).length;

  return (
    <DataTable
      columns={sectionColumns}
      data={filtered}
      emptyTitle="No sections match these filters"
      emptyDescription="Try a different class, campus, or academic year."
      toolbar={
        <>
          <Combobox options={CLASS_OPTIONS} value={classFilter} onChange={setClassFilter} placeholder="Class" className="w-36" />
          <Combobox options={CAMPUS_OPTIONS} value={campusFilter} onChange={setCampusFilter} placeholder="Campus" className="w-40" />
          <Combobox options={YEAR_OPTIONS} value={yearFilter} onChange={setYearFilter} placeholder="Academic year" className="w-40" />
          {activeCount > 0 || yearFilter ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => {
                setClassFilter(null);
                setCampusFilter(null);
                setYearFilter(null);
              }}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {sections.length}
          </span>
        </>
      }
    />
  );
}
