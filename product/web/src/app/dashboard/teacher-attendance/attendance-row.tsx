"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { markTeacherAttendance, correctTeacherAttendance } from "./actions";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LEAVE"] as const;

export function TeacherAttendanceRow({
  teacherId,
  date,
  existingRecordId,
  existingStatus,
}: {
  teacherId: string;
  date: string;
  existingRecordId?: string;
  existingStatus?: string;
}) {
  const [status, setStatus] = useState(existingStatus ?? "PRESENT");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleMark() {
    startTransition(async () => {
      const result = await markTeacherAttendance(teacherId, date, status);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCorrect(nextStatus: string) {
    if (!existingRecordId) return;
    setStatus(nextStatus);
    startTransition(async () => {
      const result = await correctTeacherAttendance(existingRecordId, nextStatus);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={(value) => {
          if (!value) return;
          if (existingRecordId) handleCorrect(value);
          else setStatus(value);
        }}
        disabled={isPending}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s[0]}
              {s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!existingRecordId ? (
        <Button size="sm" onClick={handleMark} disabled={isPending}>
          {isPending ? "Marking…" : "Mark"}
        </Button>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
