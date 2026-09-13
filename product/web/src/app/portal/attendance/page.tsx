import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { getTeacherAssignments } from "@/lib/portalScope";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MarkAttendanceForm } from "../../dashboard/attendance/mark-attendance-form";

interface Enrollment {
  id: string;
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";
  student: { id: string; fullName: string; studentCode: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  student: { id: string; fullName: string; studentCode: string };
}

interface Student {
  id: string;
  fullName: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function PortalAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { studentId: requestedStudentId } = await searchParams;
  const date = todayIso();

  if (user.roles.includes("TEACHER")) {
    const assignments = await getTeacherAssignments(user.teacherId!);
    if (assignments.length === 0) {
      return (
        <div>
          <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
          <p className="mt-4 text-sm text-muted-foreground">You have no class assignments yet.</p>
        </div>
      );
    }
    const primary = assignments[0]!;
    const [enrollments, records] = await Promise.all([
      apiRequest<Enrollment[]>(`/api/v1/enrollments?sectionId=${primary.section.id}`),
      apiRequest<AttendanceRecord[]>(`/api/v1/attendance?sectionId=${primary.section.id}&date=${date}`),
    ]);
    const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.student);

    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Attendance — {primary.klass.name} {primary.section.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{date}</p>
        <div className="mt-4">
          {activeStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actively enrolled students.</p>
          ) : records.length === 0 ? (
            <MarkAttendanceForm sectionId={primary.section.id} date={date} students={activeStudents} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStudents.map((s) => {
                    const record = records.find((r) => r.student.id === s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.fullName}</TableCell>
                        <TableCell>
                          {record ? <Badge variant={record.status === "PRESENT" ? "default" : "secondary"}>{record.status}</Badge> : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PARENT / STUDENT — read-only history
  const students = user.roles.includes("PARENT") ? await apiRequest<Student[]>("/api/v1/students") : [];
  const studentId = user.roles.includes("STUDENT") ? user.studentId! : (requestedStudentId ?? students[0]?.id);

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const records = await apiRequest<AttendanceRecord[]>(`/api/v1/attendance?studentId=${studentId}`);

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
      {records.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No attendance records yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{r.date.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "PRESENT" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
