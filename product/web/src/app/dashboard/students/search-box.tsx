"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Input } from "@/components/ui/input";

// URL-driven search (?q=...) — the page itself re-fetches server-side on
// navigation, so this stays a plain input with no client-side data fetching
// of its own. Debounced via a simple timeout to avoid a navigation per
// keystroke.
export function StudentSearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(value: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set("q", value);
      else params.delete("q");
      router.push(`/dashboard/students?${params.toString()}`);
    }, 300);
  }

  return (
    <Input
      placeholder="Search by name, student code, or phone…"
      aria-label="Search students by name, student code, or phone"
      defaultValue={initialQuery}
      onChange={(e) => handleChange(e.target.value)}
      className="max-w-sm"
    />
  );
}
