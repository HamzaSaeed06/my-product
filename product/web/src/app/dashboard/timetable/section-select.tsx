"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SectionChoice {
  id: string;
  label: string;
}

// URL-driven (?sectionId=), not local state — the page itself re-fetches
// that section's timetable server-side on navigation, same reasoning as
// the Students search box.
export function TimetableSectionSelect({ sections, selectedId }: { sections: SectionChoice[]; selectedId: string }) {
  const router = useRouter();

  return (
    <Select
      value={selectedId}
      onValueChange={(value) => router.push(`/dashboard/timetable?sectionId=${value}`)}
    >
      <SelectTrigger aria-label="Select a section" className="w-72">
        <SelectValue placeholder="Select a section" />
      </SelectTrigger>
      <SelectContent>
        {sections.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
