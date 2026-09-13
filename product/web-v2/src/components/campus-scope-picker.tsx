"use client";

import { useState } from "react";
import { Combobox } from "@/components/combobox";
import { mockCampuses } from "@/lib/mock/campuses";

const OPTIONS = [{ value: "all", label: "All campuses" }, ...mockCampuses.map((c) => ({ value: c.id, label: c.name }))];

// Some roles (Incharge, Teacher) are scoped to one campus/section and some
// list endpoints require an explicit campusId/sectionId for them — every
// screen a scoped role can reach needs a picker like this one, not an
// assumption that list endpoints return everything. Super Admin defaults to
// "All campuses"; a scoped viewer would land here pre-selected and locked.
export function CampusScopePicker() {
  const [value, setValue] = useState<string | null>("all");
  return (
    <Combobox
      options={OPTIONS}
      value={value}
      onChange={(v) => setValue(v ?? "all")}
      placeholder="All campuses"
      searchPlaceholder="Search campus…"
      className="h-8 w-44 border-none bg-transparent px-2 text-sm shadow-none hover:bg-accent"
    />
  );
}
