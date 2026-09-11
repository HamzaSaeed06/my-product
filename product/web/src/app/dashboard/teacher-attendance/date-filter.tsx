"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function DateFilter({ date }: { date: string }) {
  const router = useRouter();

  return (
    <Input
      type="date"
      value={date}
      onChange={(e) => router.push(`/dashboard/teacher-attendance?date=${e.target.value}`)}
      className="mb-4 w-44"
    />
  );
}
