import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateLeaveDialog } from "./create-dialog";
import { LeavesTable } from "./leaves-table";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
}

interface Teacher {
  id: string;
  user: { fullName: string };
}

interface Leave {
  id: string;
  subjectType: "STUDENT" | "TEACHER";
  fromDate: string;
  toDate: string;
  reason: string;
  isRetrospective: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  student: { fullName: string; studentCode: string } | null;
  teacher: { user: { fullName: string } } | null;
}

export default async function LeavesPage() {
  const currentUser = await getCurrentUser();
  // Mirrors leave.create/leave.approve/leave.reject/leave.cancel from
  // routes.ts. Real bug this fixed: /api/v1/students requires the caller
  // to either be unrestricted, hold a campus scope, or name a sectionId
  // (see lib/scope.ts assertSectionQueryInScope) — Incharge holds none of
  // those (their scope is a specific section via IncargeScope, not a
  // campus), so the old unconditional fetch (feeding a "Create leave"
  // dialog nobody in the dashboard shell but Super Admin can even submit —
  // Campus Head/Incharge/Office all lack leave.create) 500'd the entire
  // page before Incharge could see the leave queue this session's
  // auto-routing feature exists to route to them.
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("leave.create");
  const canApprove = permissions.includes("leave.approve");
  const canReject = permissions.includes("leave.reject");
  const canCancel = permissions.includes("leave.cancel");

  const [leaves, students, teachers] = await Promise.all([
    apiRequest<Leave[]>("/api/v1/leaves"),
    canCreate ? apiRequest<Student[]>("/api/v1/students") : Promise.resolve<Student[]>([]),
    canCreate ? apiRequest<Teacher[]>("/api/v1/teachers") : Promise.resolve<Teacher[]>([]),
  ]);

  const studentOptions = students.map((s) => ({ id: s.id, label: `${s.fullName} (${s.studentCode})` }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.user.fullName }));

  return (
    <div>
      <PageHeader
        title="Leaves"
        description="Student and teacher leave requests. An approved student leave auto-marks attendance as LEAVE for its covered dates."
        action={canCreate ? <CreateLeaveDialog students={studentOptions} teachers={teacherOptions} /> : undefined}
      />

      <LeavesTable leaves={leaves} canApprove={canApprove} canReject={canReject} canCancel={canCancel} />
    </div>
  );
}
