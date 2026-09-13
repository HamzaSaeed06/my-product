"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NamedOption {
  id: string;
  name: string;
}

export function CurriculumFilters({
  classes,
  academicYears,
  selectedClassId,
  selectedYearId,
}: {
  classes: NamedOption[];
  academicYears: NamedOption[];
  selectedClassId: string;
  selectedYearId: string;
}) {
  const router = useRouter();

  function navigate(classId: string, yearId: string) {
    router.push(`/dashboard/curriculum?classId=${classId}&academicYearId=${yearId}`);
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <Select value={selectedClassId} onValueChange={(value) => value && navigate(value, selectedYearId)}>
        <SelectTrigger aria-label="Filter by class" className="w-56">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedYearId} onValueChange={(value) => value && navigate(selectedClassId, value)}>
        <SelectTrigger aria-label="Filter by academic year" className="w-56">
          <SelectValue placeholder="Select an academic year" />
        </SelectTrigger>
        <SelectContent>
          {academicYears.map((y) => (
            <SelectItem key={y.id} value={y.id}>
              {y.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
