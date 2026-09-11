import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AttendanceFilters } from "./filters";
import { MarkAttendanceForm } from "./mark-attendance-form";
import { RequestCorrectionDialog } from "./correction-dialog";
import { DecideCorrectionButtons } from "./decide-correction-buttons";

interface NamedOption {
  id: string;
  name: string;
}

interface RawSection {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  archivedAt: string | null;
}

interface Enrollment {
  id: string;
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";
  student: { id: string; fullName: string; studentCode: string };
}

interface AttendanceRecord {
  id: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  student: { id: string; fullName: string; studentCode: string };
}

interface ApprovalRequest {
  id: string;
  type: string;
  status: string;
  payload: { attendanceId: string; oldStatus: string; newStatus: string; reason: string };
  requestedBy: { fullName: string };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const { sectionId: requestedSectionId, date: requestedDate } = await searchParams;
  const date = requestedDate ?? todayIso();

  const [rawSections, classes, campuses, academicYears, pendingApprovals] = await Promise.all([
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<ApprovalRequest[]>("/api/v1/approvals?status=PENDING"),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const activeSections = rawSections.filter((s) => !s.archivedAt);
  const sectionChoices = activeSections.map((s) => ({
    id: s.id,
    label: `${classNameById.get(s.classId) ?? "—"} ${s.name} · ${campusNameById.get(s.campusId) ?? "—"} · ${yearNameById.get(s.academicYearId) ?? "—"}`,
  }));

  const attendanceCorrections = pendingApprovals.filter((a) => a.type === "ATTENDANCE_CORRECTION");

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily attendance per section, or request/approve corrections." />

      {activeSections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections yet — create one under Institute Structure first.</p>
      ) : (
        <>
          <AttendanceFilters
            sections={sectionChoices}
            selectedSectionId={activeSections.find((s) => s.id === requestedSectionId)?.id ?? activeSections[0]!.id}
            date={date}
          />
          <AttendanceBody
            sectionId={activeSections.find((s) => s.id === requestedSectionId)?.id ?? activeSections[0]!.id}
            date={date}
          />
        </>
      )}

      {attendanceCorrections.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Pending attendance corrections</h2>
          <div className="flex flex-col gap-3">
            {attendanceCorrections.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm">
                  <p className="text-foreground">
                    {approval.payload.oldStatus} → {approval.payload.newStatus}
                  </p>
                  <p className="text-muted-foreground">
                    Requested by {approval.requestedBy.fullName}: &ldquo;{approval.payload.reason}&rdquo;
                  </p>
                </div>
                <DecideCorrectionButtons approvalId={approval.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function AttendanceBody({ sectionId, date }: { sectionId: string; date: string }) {
  const [enrollments, attendanceRecords] = await Promise.all([
    apiRequest<Enrollment[]>(`/api/v1/enrollments?sectionId=${sectionId}`),
    apiRequest<AttendanceRecord[]>(`/api/v1/attendance?sectionId=${sectionId}&date=${date}`),
  ]);

  const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.student);

  if (activeStudents.length === 0) {
    return <p className="text-sm text-muted-foreground">No actively enrolled students in this section.</p>;
  }

  if (attendanceRecords.length === 0) {
    return <MarkAttendanceForm sectionId={sectionId} date={date} students={activeStudents} />;
  }

  const recordByStudentId = new Map(attendanceRecords.map((r) => [r.student.id, r]));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeStudents.map((student) => {
            const record = recordByStudentId.get(student.id);
            return (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{student.studentCode}</TableCell>
                <TableCell className="font-medium">{student.fullName}</TableCell>
                <TableCell>
                  {record ? (
                    <Badge variant={record.status === "PRESENT" ? "default" : "secondary"}>{record.status}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not marked</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {record ? <RequestCorrectionDialog attendanceId={record.id} currentStatus={record.status} /> : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
