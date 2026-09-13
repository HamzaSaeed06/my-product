"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Student {
  id: string;
  fullName: string;
}

// Shared by every Parent Portal page that shows one child's data at a time
// (spec: "Multiple children switcher") — swaps the ?studentId= query param
// and lets the server component re-fetch for the newly selected child.
//
// Pinned in the persistent portal header (see app/portal/layout.tsx) instead
// of re-rendered inline below each page's own <h1>, so which child you're
// viewing stays visible while navigating between Attendance/Fees/Homework/
// etc. — previously a parent had to re-orient "whose data am I on" on every
// single page load. Self-derives the current child and the path to navigate
// back to from the URL (usePathname/useSearchParams) instead of taking them
// as props, since it now renders once in the shared header rather than once
// per page with a hardcoded basePath string.
export function ChildSwitcher({ students }: { students: Student[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (students.length <= 1) return null;

  const selectedId = searchParams.get("studentId") ?? students[0]?.id;

  return (
    <div className="w-full max-w-[180px] sm:max-w-xs">
      <Select
        value={selectedId}
        onValueChange={(v) => {
          if (v) router.push(`${pathname}?studentId=${v}`);
        }}
      >
        <SelectTrigger aria-label="Switch child" className="w-full">
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
