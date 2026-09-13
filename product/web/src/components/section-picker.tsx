"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SectionOption {
  id: string;
  name: string;
  classId: string;
  className: string;
  campusName: string;
  academicYearId: string;
  academicYearName: string;
}

// A Section implies its class/campus/year — used wherever a form needs a
// section plus the classId/academicYearId that go with it (Enrollment,
// Teacher Assignment), rather than three independently-pickable dropdowns
// that could disagree with each other. Emits hidden classId/academicYearId
// inputs synced to whichever section is selected.
export function SectionPicker({
  sections,
  sectionFieldName = "sectionId",
  emitClassId = true,
  emitAcademicYearId = true,
}: {
  sections: SectionOption[];
  sectionFieldName?: string;
  emitClassId?: boolean;
  emitAcademicYearId?: boolean;
}) {
  const [selected, setSelected] = useState<SectionOption | undefined>(sections[0]);

  return (
    <>
      <Select
        name={sectionFieldName}
        defaultValue={sections[0]?.id}
        disabled={sections.length === 0}
        onValueChange={(value) => setSelected(sections.find((s) => s.id === value))}
      >
        <SelectTrigger aria-label="Select a section" className="w-full">
          <SelectValue placeholder="Select a section" />
        </SelectTrigger>
        <SelectContent>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.className} — {s.campusName} — Section {s.name} ({s.academicYearName})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {emitClassId ? <input type="hidden" name="classId" value={selected?.classId ?? ""} /> : null}
      {emitAcademicYearId ? (
        <input type="hidden" name="academicYearId" value={selected?.academicYearId ?? ""} />
      ) : null}
    </>
  );
}
