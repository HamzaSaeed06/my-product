"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import type { Student } from "@/lib/mock/students";
import { DataTable } from "@/components/data-table";
import { studentColumns } from "./columns";

const CLASS_OPTIONS = Array.from(new Set(["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"])).map((c) => ({
  value: c,
  label: c,
}));

// The old build used a plain <Select> even for lists that run into the
// hundreds. This Combobox is the searchable replacement, per the
// interaction-pattern rules — sized here for "class," but the same
// component is what a "pick a teacher" or "pick a student" screen would use.
export function StudentFilters({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter && s.className !== classFilter) return false;
      if (search && !s.fullName.toLowerCase().includes(search.toLowerCase()) && !s.admissionNo.includes(search)) return false;
      return true;
    });
  }, [students, search, classFilter]);

  return (
    <DataTable
      columns={studentColumns}
      data={filtered}
      emptyTitle="No students match these filters"
      emptyDescription="Clear the class filter or try a different search term."
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
            placeholder="All classes"
            searchPlaceholder="Search class…"
            className="w-40"
          />
        </>
      }
    />
  );
}
