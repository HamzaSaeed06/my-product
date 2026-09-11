"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AcademicFilters({
  exams,
  sections,
  selectedExamId,
  selectedSectionId,
}: {
  exams: { id: string; name: string }[];
  sections: { id: string; label: string }[];
  selectedExamId: string;
  selectedSectionId: string;
}) {
  const router = useRouter();

  function navigate(examId: string, sectionId: string) {
    router.push(`/dashboard/reports/academic?examId=${examId}${sectionId ? `&sectionId=${sectionId}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedExamId} onValueChange={(value) => value && navigate(value, "")}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Select an exam" />
        </SelectTrigger>
        <SelectContent>
          {exams.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedSectionId || "all"} onValueChange={(value) => value && navigate(selectedExamId, value === "all" ? "" : value)}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="All sections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sections</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
