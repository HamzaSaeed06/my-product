import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
}

interface TeacherAssignment {
  id: string;
  subject: { name: string };
  klass: { name: string };
  section: { name: string };
}

export default async function PortalOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.roles.includes("TEACHER")) {
    const assignments = await apiRequest<TeacherAssignment[]>(
      `/api/v1/teacher-assignments?teacherId=${user.teacherId}`
    );
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Welcome, {user.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your assigned classes this year.</p>
        {assignments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No class assignments yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">
                  {a.klass.name} {a.section.name}
                </p>
                <p className="text-xs text-muted-foreground">{a.subject.name}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/portal/attendance" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
            Mark attendance
          </Link>
          <Link href="/portal/homework" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
            Assign homework
          </Link>
        </div>
      </div>
    );
  }

  if (user.roles.includes("PARENT")) {
    const children = await apiRequest<Student[]>("/api/v1/students");
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Welcome, {user.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your children.</p>
        {children.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {children.map((child) => (
              <div key={child.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{child.fullName}</p>
                <p className="font-mono text-xs text-muted-foreground">{child.studentCode}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/portal/fees" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
            View fees
          </Link>
          <Link href="/portal/leave" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
            Request leave
          </Link>
        </div>
      </div>
    );
  }

  // STUDENT
  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Welcome, {user.fullName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here&apos;s a quick look at your academics.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/portal/timetable" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          Today&apos;s timetable
        </Link>
        <Link href="/portal/homework" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          Homework
        </Link>
        <Link href="/portal/results" className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          Results
        </Link>
      </div>
    </div>
  );
}
