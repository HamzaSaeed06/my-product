import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { getTeacherAssignments, getActiveEnrollment } from "@/lib/portalScope";

interface TimetableEntry {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string | null;
  endTime: string | null;
  subject: { name: string };
  teacher: { user: { fullName: string } };
}

interface Timetable {
  entries: TimetableEntry[];
}

interface Student {
  id: string;
  fullName: string;
}

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function groupByDay(entries: TimetableEntry[]) {
  const groups = new Map<string, TimetableEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.dayOfWeek) ?? [];
    list.push(entry);
    groups.set(entry.dayOfWeek, list);
  }
  return DAY_ORDER.map((day) => ({ day, entries: groups.get(day) ?? [] })).filter((g) => g.entries.length > 0);
}

function TimetableView({ timetable }: { timetable: Timetable | null }) {
  if (!timetable || timetable.entries.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No timetable entries yet.</p>;
  }
  const days = groupByDay(timetable.entries);
  return (
    <div className="mt-4 flex flex-col gap-4">
      {days.map(({ day, entries }) => (
        <div key={day}>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">{day}</p>
          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.subject.name}</p>
                  <p className="text-xs text-muted-foreground">{e.teacher.user.fullName}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Period {e.periodNumber}</p>
                  {e.startTime ? (
                    <p>
                      {e.startTime}–{e.endTime}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function PortalTimetablePage({
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
          <h1 className="text-lg font-semibold text-foreground">Timetable</h1>
          <p className="mt-4 text-sm text-muted-foreground">You have no class assignments yet.</p>
        </div>
      );
    }
    const primary = assignments[0]!;
    const timetable = await apiRequest<Timetable>(
      `/api/v1/timetables?sectionId=${primary.section.id}&academicYearId=${primary.academicYear.id}`
    );
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Timetable — {primary.klass.name} {primary.section.name}
        </h1>
        <TimetableView timetable={timetable} />
      </div>
    );
  }

  // PARENT / STUDENT
  const students =
    user.roles.includes("PARENT") ? await apiRequest<Student[]>("/api/v1/students") : [];
  const studentId = user.roles.includes("STUDENT") ? user.studentId! : (requestedStudentId ?? students[0]?.id);

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Timetable</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const enrollment = await getActiveEnrollment(studentId);
  const timetable = enrollment
    ? await apiRequest<Timetable>(
        `/api/v1/timetables?sectionId=${enrollment.section.id}&academicYearId=${enrollment.academicYear.id}`
      )
    : null;

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Timetable</h1>
      {!enrollment ? (
        <p className="mt-4 text-sm text-muted-foreground">Not currently enrolled in any class.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {enrollment.klass.name} {enrollment.section.name}
          </p>
          <TimetableView timetable={timetable} />
        </>
      )}
    </div>
  );
}
