import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentProfileForm } from "./profile-form";
import { EnrollDialog, TransferDialog, type SectionOption } from "./enrollment-dialogs";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { WithdrawStudentButton, ArchiveStudentButton, WithdrawEnrollmentButton } from "./student-actions";

interface StudentDetail {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
  parents: { id: string; relationship: string | null; parent: { id: string; fullName: string; phone: string } }[];
  enrollments: {
    id: string;
    status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";
    rollNumber: string | null;
    enrolledAt: string;
    academicYear: { id: string; name: string };
    klass: { id: string; name: string };
    section: { id: string; name: string };
  }[];
}

interface DocumentRow {
  id: string;
  originalName: string;
  category: string | null;
  isSensitive: boolean;
  createdAt: string;
}

interface RawSection {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  archivedAt: string | null;
}

interface NamedOption {
  id: string;
  name: string;
}

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;

  // Mirrors student.edit/student.archive from students/routes.ts and
  // enrollment.create/enrollment.transfer/enrollment.withdraw from
  // enrollments/routes.ts (separate module, separate keys — NOT
  // student.archive) and document.view/document.upload from the
  // students/:id/documents routes. Office/Incharge frequently hold
  // student.view without the write keys, so every write action below must
  // be gated, and the sections/classes/campuses/academic-years fetch (which
  // exists only to feed the Enroll/Transfer dialogs' section picker) must
  // not run unless the viewer can actually use one of those dialogs.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canEdit = permissions.includes("student.edit");
  const canArchive = permissions.includes("student.archive");
  const canCreateEnrollment = permissions.includes("enrollment.create");
  const canTransferEnrollment = permissions.includes("enrollment.transfer");
  const canWithdrawEnrollment = permissions.includes("enrollment.withdraw");
  const canViewDocuments = permissions.includes("document.view");
  const canUploadDocuments = permissions.includes("document.upload");
  const needsSectionOptions = canCreateEnrollment || canTransferEnrollment;

  const [student, documents, rawSections, classes, campuses, academicYears] = await Promise.all([
    apiRequest<StudentDetail>(`/api/v1/students/${studentId}`),
    canViewDocuments
      ? apiRequest<DocumentRow[]>(`/api/v1/students/${studentId}/documents`)
      : Promise.resolve<DocumentRow[]>([]),
    needsSectionOptions ? apiRequest<RawSection[]>("/api/v1/sections") : Promise.resolve<RawSection[]>([]),
    needsSectionOptions ? apiRequest<NamedOption[]>("/api/v1/classes") : Promise.resolve<NamedOption[]>([]),
    needsSectionOptions ? apiRequest<NamedOption[]>("/api/v1/campuses") : Promise.resolve<NamedOption[]>([]),
    needsSectionOptions ? apiRequest<NamedOption[]>("/api/v1/academic-years") : Promise.resolve<NamedOption[]>([]),
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

  const activeEnrollment = student.enrollments.find((e) => e.status === "ACTIVE");
  const transferSections = activeEnrollment
    ? sections.filter((s) => s.academicYearId === activeEnrollment.academicYear.id)
    : [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={student.fullName}
        description={`${student.studentCode} · ${student.status}`}
        action={
          student.status === "ACTIVE" && canArchive ? (
            <div className="flex gap-2">
              <WithdrawStudentButton studentId={student.id} name={student.fullName} />
              <ArchiveStudentButton studentId={student.id} name={student.fullName} />
            </div>
          ) : undefined
        }
      />

      <section className="mb-8 rounded-lg border border-border p-5">
        <SectionHeading>Profile</SectionHeading>
        <StudentProfileForm student={student} canEdit={canEdit} />
      </section>

      <section className="mb-8 rounded-lg border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeading className="mb-0">Enrollment</SectionHeading>
          {!activeEnrollment && canCreateEnrollment && <EnrollDialog studentId={student.id} sections={sections} />}
        </div>

        {student.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic year</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Roll no.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.academicYear.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.klass.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.section.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.rollNumber ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "ACTIVE" ? "default" : "secondary"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {e.status === "ACTIVE" && (
                        <>
                          {canTransferEnrollment && (
                            <TransferDialog studentId={student.id} enrollmentId={e.id} sections={transferSections} />
                          )}
                          {canWithdrawEnrollment && (
                            <WithdrawEnrollmentButton studentId={student.id} enrollmentId={e.id} />
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="mb-8 rounded-lg border border-border p-5">
        <SectionHeading>Parents / Guardians</SectionHeading>
        {student.parents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No parents linked yet. Link them from the Parents page.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {student.parents.map((link) => (
              <li key={link.id} className="text-foreground">
                {link.parent.fullName}{" "}
                <span className="text-muted-foreground">
                  ({link.parent.phone}
                  {link.relationship ? ` · ${link.relationship}` : ""})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeading className="mb-0">Documents</SectionHeading>
          {canUploadDocuments && <DocumentUploadDialog studentId={student.id} />}
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between">
                <span className="text-foreground">
                  {doc.originalName}
                  {doc.category ? <span className="text-muted-foreground"> · {doc.category}</span> : null}
                </span>
                {doc.isSensitive ? <Badge variant="secondary">Sensitive</Badge> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
