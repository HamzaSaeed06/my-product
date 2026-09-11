import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateFilter } from "./date-filter";
import { TeacherAttendanceRow } from "./attendance-row";

interface Teacher {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  user: { fullName: string };
}

interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: requestedDate } = await searchParams;
  const date = requestedDate ?? todayIso();

  const [teachers, records] = await Promise.all([
    apiRequest<Teacher[]>("/api/v1/teachers"),
    apiRequest<TeacherAttendanceRecord[]>(`/api/v1/teacher-attendance?date=${date}`),
  ]);

  const activeTeachers = teachers.filter((t) => t.status === "ACTIVE");
  const recordByTeacherId = new Map(records.map((r) => [r.teacherId, r]));

  return (
    <div>
      <PageHeader title="Teacher Attendance" description="Mark or correct daily teacher attendance." />

      <DateFilter date={date} />

      {activeTeachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No teachers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTeachers.map((teacher) => {
                const record = recordByTeacherId.get(teacher.id);
                return (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.user.fullName}</TableCell>
                    <TableCell>
                      <TeacherAttendanceRow
                        teacherId={teacher.id}
                        date={date}
                        existingRecordId={record?.id}
                        existingStatus={record?.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
