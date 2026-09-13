import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateSectionDialog } from "./section-dialogs";
import { SectionsTable } from "./sections-table";

interface Section {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  capacity: number | null;
  archivedAt: string | null;
}

interface NamedOption {
  id: string;
  name: string;
}

export default async function SectionsPage() {
  // Mirrors section.create/edit/archive from routes.ts — Incharge holds
  // only section.view (they oversee an existing section, not create ones)
  // — and campus.view, which Incharge also lacks and which the "Campus"
  // column and Create dialog both need; skip the fetch and show "—" per
  // row instead of 403ing (same graceful-degradation as Timetable/
  // Substitutions), same as before the earlier academic_year.view grant.
  const permissions = (await getCurrentUser())?.permissions ?? [];
  const canCreate = permissions.includes("section.create");
  const canEdit = permissions.includes("section.edit");
  const canArchive = permissions.includes("section.archive");
  const canViewCampuses = permissions.includes("campus.view");

  const [sections, classes, campuses, academicYears] = await Promise.all([
    apiRequest<Section[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    canViewCampuses ? apiRequest<NamedOption[]>("/api/v1/campuses") : Promise.resolve<NamedOption[]>([]),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
  ]);

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const campusNameById = Object.fromEntries(campuses.map((c) => [c.id, c.name]));
  const yearNameById = Object.fromEntries(academicYears.map((y) => [y.id, y.name]));

  return (
    <div>
      <PageHeader
        title="Sections"
        description="The actual campus + academic-year instance of a class — this is what students will enroll into."
        action={canCreate ? <CreateSectionDialog classes={classes} campuses={campuses} academicYears={academicYears} /> : undefined}
      />

      <SectionsTable
        sections={sections}
        classNameById={classNameById}
        campusNameById={campusNameById}
        yearNameById={yearNameById}
        canEdit={canEdit}
        canArchive={canArchive}
      />
    </div>
  );
}
