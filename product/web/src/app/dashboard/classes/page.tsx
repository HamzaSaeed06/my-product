import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateClassDialog } from "./class-dialogs";
import { ClassesTable } from "./classes-table";

interface Klass {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
}

export default async function ClassesPage() {
  // Mirrors class.create/class.edit/class.archive from routes.ts.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("class.create");
  const canEdit = permissions.includes("class.edit");
  const canArchive = permissions.includes("class.archive");

  const classes = await apiRequest<Klass[]>("/api/v1/classes");

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Institute-wide class catalog (e.g. Montessori, Class 5) — names are fully configurable."
        action={canCreate ? <CreateClassDialog /> : undefined}
      />

      <ClassesTable classes={classes} canEdit={canEdit} canArchive={canArchive} />
    </div>
  );
}
