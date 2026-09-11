import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { getTeacherAssignments, getActiveEnrollment } from "@/lib/portalScope";
import { ChildSwitcher } from "@/components/child-switcher";
import { CreatePortalHomeworkDialog } from "./create-dialog";

interface Homework {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: "DRAFT" | "PUBLISHED";
  subject: { name: string };
}

interface Student {
  id: string;
  fullName: string;
}

function HomeworkList({ items }: { items: Homework[] }) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No homework yet.</p>;
  }
  return (
    <div className="mt-4 flex flex-col gap-2">
      {items.map((hw) => (
        <div key={hw.id} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{hw.title}</p>
            <span className="text-xs text-muted-foreground">Due {hw.dueDate.slice(0, 10)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{hw.subject.name}</p>
          {hw.description ? <p className="mt-1 text-sm text-muted-foreground">{hw.description}</p> : null}
        </div>
      ))}
    </div>
  );
}

export default async function PortalHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { studentId: requestedStudentId } = await searchParams;

  if (user.roles.includes("TEACHER")) {
    const assignments = await getTeacherAssignments(user.teacherId!);
    if (assignments.length === 0) {
      return (
        <div>
          <h1 className="text-lg font-semibold text-foreground">Homework</h1>
          <p className="mt-4 text-sm text-muted-foreground">You have no class assignments yet.</p>
        </div>
      );
    }
    const primary = assignments[0]!;
    const homework = await apiRequest<Homework[]>(`/api/v1/homework?sectionId=${primary.section.id}`);
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Homework — {primary.klass.name} {primary.section.name}
          </h1>
          <CreatePortalHomeworkDialog
            sectionId={primary.section.id}
            classId={primary.klass.id}
            subjectId={primary.subject.id}
            teacherId={user.teacherId!}
          />
        </div>
        <HomeworkList items={homework} />
      </div>
    );
  }

  // PARENT / STUDENT
  const students = user.roles.includes("PARENT") ? await apiRequest<Student[]>("/api/v1/students") : [];
  const studentId = user.roles.includes("STUDENT") ? user.studentId! : (requestedStudentId ?? students[0]?.id);

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Homework</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const enrollment = await getActiveEnrollment(studentId);
  const homework = enrollment ? await apiRequest<Homework[]>(`/api/v1/homework?sectionId=${enrollment.section.id}`) : [];

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Homework</h1>
      {user.roles.includes("PARENT") ? (
        <ChildSwitcher students={students} selectedId={studentId} basePath="/portal/homework" />
      ) : null}
      {!enrollment ? (
        <p className="mt-4 text-sm text-muted-foreground">Not currently enrolled in any class.</p>
      ) : (
        <HomeworkList items={homework.filter((h) => h.status === "PUBLISHED")} />
      )}
    </div>
  );
}
