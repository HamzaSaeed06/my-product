"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Student {
  id: string;
  fullName: string;
}

// Shared by every Parent Portal page that shows one child's data at a time
// (spec: "Multiple children switcher") — swaps the ?studentId= query param
// and lets the server component re-fetch for the newly selected child.
export function ChildSwitcher({
  students,
  selectedId,
  basePath,
}: {
  students: Student[];
  selectedId: string;
  basePath: string;
}) {
  const router = useRouter();

  if (students.length <= 1) return null;

  return (
    <div className="mt-3 max-w-xs">
      <Select
        value={selectedId}
        onValueChange={(v) => {
          if (v) router.push(`${basePath}?studentId=${v}`);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
