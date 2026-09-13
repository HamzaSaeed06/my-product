"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { markAttendance } from "./actions";

interface StudentRow {
  id: string;
  fullName: string;
  studentCode: string;
}

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LEAVE"] as const;

export function MarkAttendanceForm({ sectionId, date, students }: { sectionId: string; date: string; students: StudentRow[] }) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.id, "PRESENT"]))
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      const entries = students.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "PRESENT" }));
      const result = await markAttendance(sectionId, date, entries);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{student.studentCode}</TableCell>
                <TableCell className="font-medium">{student.fullName}</TableCell>
                <TableCell>
                  <Select
                    value={statuses[student.id]}
                    onValueChange={(value) => value && setStatuses((prev) => ({ ...prev, [student.id]: value }))}
                  >
                    <SelectTrigger aria-label={`Attendance status for ${student.fullName}`} className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status[0]}
                          {status.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button className="mt-4" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Submitting…" : "Submit attendance"}
      </Button>
    </div>
  );
}
