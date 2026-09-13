import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateSubjectDialog } from "./subject-dialogs";
import { SubjectsTable } from "./subjects-table";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  archivedAt: string | null;
}

export default async function SubjectsPage() {
  // Mirrors subject.create/subject.edit/subject.archive from routes.ts.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("subject.create");
  const canEdit = permissions.includes("subject.edit");
  const canArchive = permissions.includes("subject.archive");

  const subjects = await apiRequest<Subject[]>("/api/v1/subjects");

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Institute-wide subject catalog."
        action={canCreate ? <CreateSubjectDialog /> : undefined}
      />

      <SubjectsTable subjects={subjects} canEdit={canEdit} canArchive={canArchive} />
    </div>
  );
}
