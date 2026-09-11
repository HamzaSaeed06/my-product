import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AssignSubstituteDialog } from "./assign-dialog";
import { CancelSubstitutionButton } from "./cancel-button";

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

interface Substitution {
  id: string;
  date: string;
  cancelledAt: string | null;
  timetableEntry: { subject: { name: string } };
  originalTeacher: { user: { fullName: string } };
  substituteTeacher: { user: { fullName: string } };
}

export default async function SubstitutionsPage() {
  const [substitutions, rawSections, classes, campuses, academicYears, teachers] = await Promise.all([
    apiRequest<Substitution[]>("/api/v1/substitutions"),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<Teacher[]>("/api/v1/teachers"),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const sectionChoices = rawSections
    .filter((s) => !s.archivedAt)
    .map((s) => ({
      id: s.id,
      academicYearId: s.academicYearId,
      label: `${classNameById.get(s.classId) ?? "—"} ${s.name} · ${campusNameById.get(s.campusId) ?? "—"} · ${yearNameById.get(s.academicYearId) ?? "—"}`,
    }));

  const activeTeachers = teachers.filter((t) => t.status === "ACTIVE").map((t) => ({ id: t.id, name: t.user.fullName }));

  return (
    <div>
      <PageHeader
        title="Substitutions"
        description="Cover an absent teacher's period with a free substitute."
        action={<AssignSubstituteDialog sections={sectionChoices} teachers={activeTeachers} />}
      />

      {substitutions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No substitutions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Original Teacher</TableHead>
                <TableHead>Substitute</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {substitutions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{s.date.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.timetableEntry.subject.name}</TableCell>
                  <TableCell>{s.originalTeacher.user.fullName}</TableCell>
                  <TableCell>{s.substituteTeacher.user.fullName}</TableCell>
                  <TableCell>
                    {s.cancelledAt ? <Badge variant="secondary">Cancelled</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {!s.cancelledAt ? <CancelSubstitutionButton id={s.id} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
