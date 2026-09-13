import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateSectionDialog, EditSectionDialog } from "./section-dialogs";
import { ArchiveSectionButton } from "./archive-section-button";

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

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  return (
    <div>
      <PageHeader
        title="Sections"
        description="The actual campus + academic-year instance of a class — this is what students will enroll into."
        action={canCreate ? <CreateSectionDialog classes={classes} campuses={campuses} academicYears={academicYears} /> : undefined}
      />

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections yet. Click "Add section" to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                {canEdit || canArchive ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {classNameById.get(section.classId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {campusNameById.get(section.campusId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {yearNameById.get(section.academicYearId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{section.capacity ?? "—"}</TableCell>
                  <TableCell>
                    {section.archivedAt ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  {canEdit || canArchive ? (
                    <TableCell className="flex justify-end gap-2">
                      {!section.archivedAt && (
                        <>
                          {canEdit ? <EditSectionDialog section={section} /> : null}
                          {canArchive ? <ArchiveSectionButton id={section.id} name={section.name} /> : null}
                        </>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
