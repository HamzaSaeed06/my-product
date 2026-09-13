import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateAssignmentDialog } from "./assignment-dialogs";
import { TeacherAssignmentsTable } from "./teacher-assignments-table";
import type { SectionOption } from "@/components/section-picker";

interface Assignment {
  id: string;
  teacher: { user: { fullName: string } };
  subject: { name: string };
  klass: { name: string };
  section: { name: string };
  academicYear: { name: string };
}

interface Teacher {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  user: { fullName: string };
}

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

export default async function TeacherAssignmentsPage() {
  // teacher_assignment.create/.edit from routes.ts. teachers/subjects/
  // sections/classes/campuses/academicYears are fetched only to feed the
  // "Assign teacher" dialog (sections' own class/campus/year labels are
  // built from classes/campuses/academicYears purely for that dialog's
  // SectionPicker) — none of it is used elsewhere on this page, so gate
  // all of it behind canCreate.
  const permissions = (await getCurrentUser())?.permissions ?? [];
  const canCreate = permissions.includes("teacher_assignment.create");
  const canEdit = permissions.includes("teacher_assignment.edit");

  const [assignments, teachers, subjects, rawSections, classes, campuses, academicYears] = await Promise.all([
    apiRequest<Assignment[]>("/api/v1/teacher-assignments"),
    canCreate ? apiRequest<Teacher[]>("/api/v1/teachers") : Promise.resolve<Teacher[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/subjects") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<RawSection[]>("/api/v1/sections") : Promise.resolve<RawSection[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/classes") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/campuses") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/academic-years") : Promise.resolve<NamedOption[]>([]),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const sections: SectionOption[] = rawSections
    .filter((s) => !s.archivedAt)
    .map((s) => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      className: classNameById.get(s.classId) ?? "—",
      campusName: campusNameById.get(s.campusId) ?? "—",
      academicYearId: s.academicYearId,
      academicYearName: yearNameById.get(s.academicYearId) ?? "—",
    }));

  const activeTeachers = teachers
    .filter((t) => t.status === "ACTIVE")
    .map((t) => ({ id: t.id, name: t.user.fullName }));

  return (
    <div>
      <PageHeader
        title="Teacher Assignments"
        description="Which teacher teaches which subject to which section, per academic year."
        action={canCreate ? <CreateAssignmentDialog teachers={activeTeachers} subjects={subjects} sections={sections} /> : undefined}
      />

      <TeacherAssignmentsTable assignments={assignments} canEdit={canEdit} />
    </div>
  );
}
