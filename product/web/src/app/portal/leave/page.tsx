import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { ChildSwitcher } from "@/components/child-switcher";
import { Badge } from "@/components/ui/badge";
import { RequestPortalLeaveDialog } from "./create-dialog";
import { CancelPortalLeaveButton } from "./cancel-button";

interface Leave {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  isRetrospective: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}

interface Student {
  id: string;
  fullName: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

function LeaveList({ leaves }: { leaves: Leave[] }) {
  if (leaves.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No leave requests yet.</p>;
  }
  return (
    <div className="mt-4 flex flex-col gap-2">
      {leaves.map((leave) => (
        <div key={leave.id} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              {leave.fromDate.slice(0, 10)} → {leave.toDate.slice(0, 10)}
            </p>
            <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{leave.reason}</p>
          {leave.status === "PENDING" || leave.status === "APPROVED" ? (
            <div className="mt-2 flex justify-end">
              <CancelPortalLeaveButton id={leave.id} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default async function PortalLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { studentId: requestedStudentId } = await searchParams;

  if (user.roles.includes("TEACHER")) {
    const leaves = await apiRequest<Leave[]>("/api/v1/leaves");
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">My Leave</h1>
          <RequestPortalLeaveDialog
            subjectType="TEACHER"
            subjectId={user.teacherId!}
            triggerLabel="+ Request leave"
            title="Request leave"
          />
        </div>
        <LeaveList leaves={leaves} />
      </div>
    );
  }

  // PARENT
  const students = await apiRequest<Student[]>("/api/v1/students");
  const studentId = requestedStudentId ?? students[0]?.id;

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Leave Requests</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const leaves = await apiRequest<Leave[]>(`/api/v1/leaves?studentId=${studentId}`);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Leave Requests</h1>
        <RequestPortalLeaveDialog
          subjectType="STUDENT"
          subjectId={studentId}
          triggerLabel="+ Request leave"
          title="Request leave for your child"
        />
      </div>
      <ChildSwitcher students={students} selectedId={studentId} basePath="/portal/leave" />
      <LeaveList leaves={leaves} />
    </div>
  );
}
