"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReportCardFilters({
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
    router.push(`/dashboard/report-cards?examId=${examId}&sectionId=${sectionId}`);
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <Select value={selectedExamId} onValueChange={(value) => value && navigate(value, selectedSectionId)}>
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
      <Select value={selectedSectionId} onValueChange={(value) => value && navigate(selectedExamId, value)}>
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
    </div>
  );
}
