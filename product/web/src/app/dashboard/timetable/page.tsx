import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { TimetableSectionSelect } from "./section-select";
import { AddEntryDialog } from "./entry-dialog";
import { RemoveEntryButton } from "./remove-entry-button";
import { PublishTimetableButton } from "./publish-button";

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

interface Teacher {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  user: { fullName: string };
}

interface TimetableEntry {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  subject: { name: string };
  teacher: { user: { fullName: string } };
}

interface Timetable {
  id: string;
  status: "DRAFT" | "PUBLISHED";
  entries: TimetableEntry[];
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const { sectionId: requestedSectionId } = await searchParams;

  // Incharge holds class.view/section.view/subject.view/teacher.view (all
  // needed to actually view and build a timetable) but not campus.view or
  // academic_year.view — those two are fetched only to label the section
  // picker ("Grade 5 A · Main Campus · 2026"), so skip them rather than
  // 403 the whole page; the label falls back to "—" for the missing part
  // (same fix as the Substitutions page).
  const permissions = (await getCurrentUser())?.permissions ?? [];
  const canViewCampuses = permissions.includes("campus.view");
  const canViewAcademicYears = permissions.includes("academic_year.view");

  const [rawSections, classes, campuses, academicYears, subjects, teachers] = await Promise.all([
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    canViewCampuses ? apiRequest<NamedOption[]>("/api/v1/campuses") : Promise.resolve<NamedOption[]>([]),
    canViewAcademicYears ? apiRequest<NamedOption[]>("/api/v1/academic-years") : Promise.resolve<NamedOption[]>([]),
    apiRequest<NamedOption[]>("/api/v1/subjects"),
    apiRequest<Teacher[]>("/api/v1/teachers"),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const activeSections = rawSections.filter((s) => !s.archivedAt);
  const sectionChoices = activeSections.map((s) => ({
    id: s.id,
    label: `${classNameById.get(s.classId) ?? "—"} ${s.name} · ${campusNameById.get(s.campusId) ?? "—"} · ${yearNameById.get(s.academicYearId) ?? "—"}`,
  }));

  const activeTeachers = teachers.filter((t) => t.status === "ACTIVE").map((t) => ({ id: t.id, name: t.user.fullName }));

  return (
    <div>
      <PageHeader title="Timetable" description="Build the period-by-period schedule for a section, then publish it." />

      {activeSections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections yet — create one under Institute Structure first.</p>
      ) : (
        <TimetableBody
          sectionChoices={sectionChoices}
          activeSections={activeSections}
          requestedSectionId={requestedSectionId}
          subjects={subjects}
          teachers={activeTeachers}
          canPublish={permissions.includes("timetable.publish")}
        />
      )}
    </div>
  );
}

async function TimetableBody({
  sectionChoices,
  activeSections,
  requestedSectionId,
  subjects,
  teachers,
  canPublish,
}: {
  sectionChoices: { id: string; label: string }[];
  activeSections: RawSection[];
  requestedSectionId: string | undefined;
  subjects: NamedOption[];
  teachers: NamedOption[];
  canPublish: boolean;
}) {
  const selectedSection =
    activeSections.find((s) => s.id === requestedSectionId) ?? activeSections[0]!;

  const timetable = await apiRequest<Timetable>(
    `/api/v1/timetables?sectionId=${selectedSection.id}&academicYearId=${selectedSection.academicYearId}`
  );

  const entryByCell = new Map(timetable.entries.map((e) => [`${e.dayOfWeek}-${e.periodNumber}`, e]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <TimetableSectionSelect sections={sectionChoices} selectedId={selectedSection.id} />
        <div className="flex items-center gap-3">
          {timetable.status === "PUBLISHED" ? (
            <span className="text-sm font-medium text-foreground">Published</span>
          ) : canPublish ? (
            <PublishTimetableButton timetableId={timetable.id} />
          ) : (
            <span className="text-sm text-muted-foreground">Draft — awaiting publish</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-border p-2 text-left text-xs font-medium text-muted-foreground">Period</th>
              {DAYS.map((day) => (
                <th key={day} className="border-b border-border p-2 text-left text-xs font-medium text-muted-foreground">
                  {day[0]}
                  {day.slice(1, 3).toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <td className="border-b border-border p-2 align-top text-xs text-muted-foreground">P{period}</td>
                {DAYS.map((day) => {
                  const entry = entryByCell.get(`${day}-${period}`);
                  return (
                    <td key={day} className="border-b border-border p-2 align-top">
                      {entry ? (
                        <div className="flex flex-col gap-1 rounded-md bg-secondary/50 p-2">
                          <span className="text-xs font-medium text-foreground">{entry.subject.name}</span>
                          <span className="text-xs text-muted-foreground">{entry.teacher.user.fullName}</span>
                          <RemoveEntryButton entryId={entry.id} />
                        </div>
                      ) : (
                        <AddEntryDialog
                          timetableId={timetable.id}
                          dayOfWeek={day}
                          periodNumber={period}
                          subjects={subjects}
                          teachers={teachers}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
