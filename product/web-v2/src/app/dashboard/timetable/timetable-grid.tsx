"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { DAYS, DAY_LABELS, PERIODS, type TimetableEntry } from "@/lib/mock/timetable";
import type { EntrySlot } from "./entry-dialog";

export function TimetableGrid({
  entries,
  onCellClick,
}: {
  entries: TimetableEntry[];
  onCellClick: (slot: EntrySlot) => void;
}) {
  const findEntry = (day: (typeof DAYS)[number], period: number) =>
    entries.find((e) => e.dayOfWeek === day && e.periodNumber === period);

  return (
    <div className="surface-ring overflow-x-auto rounded-[var(--card-radius)]">
      <div className="grid min-w-[720px] grid-cols-[64px_repeat(6,1fr)]">
        <div className="border-b border-border p-2" />
        {DAYS.map((day) => (
          <div key={day} className="label-eyebrow border-b border-border p-2 text-center text-muted-foreground">
            {DAY_LABELS[day]}
          </div>
        ))}
        {PERIODS.map((period) => (
          <div key={period} className="contents">
            <div className="flex items-center justify-center border-b border-border p-2 text-xs font-medium text-muted-foreground">
              P{period}
            </div>
            {DAYS.map((day) => {
              const entry = findEntry(day, period);
              const subject = entry ? mockSubjects.find((s) => s.id === entry.subjectId) : null;
              const teacher = entry ? mockTeachers.find((t) => t.id === entry.teacherId) : null;
              const teacherName = teacher ? mockAppUsers.find((u) => u.id === teacher.userId)?.fullName : null;

              return (
                <button
                  key={`${day}-${period}`}
                  type="button"
                  onClick={() =>
                    onCellClick({
                      day,
                      period,
                      subjectId: entry?.subjectId ?? null,
                      teacherId: entry?.teacherId ?? null,
                      entryId: entry?.id ?? null,
                    })
                  }
                  className={cn(
                    "group flex min-h-16 flex-col items-start justify-center gap-0.5 border-b border-l border-border p-2 text-left transition-colors hover:bg-accent",
                    !entry && "items-center justify-center",
                  )}
                >
                  {entry ? (
                    <>
                      <span className="text-xs font-medium text-foreground">{subject?.name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{teacherName}</span>
                    </>
                  ) : (
                    <Plus className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
