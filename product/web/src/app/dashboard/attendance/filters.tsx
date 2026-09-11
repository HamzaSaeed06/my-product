"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function AttendanceFilters({
  sections,
  selectedSectionId,
  date,
}: {
  sections: { id: string; label: string }[];
  selectedSectionId: string;
  date: string;
}) {
  const router = useRouter();

  function navigate(nextSectionId: string, nextDate: string) {
    router.push(`/dashboard/attendance?sectionId=${nextSectionId}&date=${nextDate}`);
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <Select value={selectedSectionId} onValueChange={(value) => value && navigate(value, date)}>
        <SelectTrigger className="w-72">
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
      <Input
        type="date"
        value={date}
        onChange={(e) => navigate(selectedSectionId, e.target.value)}
        className="w-44"
      />
    </div>
  );
}
