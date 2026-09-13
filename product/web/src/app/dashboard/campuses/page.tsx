import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateCampusDialog } from "./campus-dialogs";
import { CampusesTable } from "./campuses-table";

interface Campus {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  archivedAt: string | null;
}

export default async function CampusesPage() {
  // Mirrors campus.create/campus.edit/campus.archive from routes.ts.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("campus.create");
  const canEdit = permissions.includes("campus.edit");
  const canArchive = permissions.includes("campus.archive");

  const campuses = await apiRequest<Campus[]>("/api/v1/campuses");

  return (
    <div>
      <PageHeader
        title="Campuses"
        description="Branches/campuses under this institute."
        action={canCreate ? <CreateCampusDialog /> : undefined}
      />

      <CampusesTable campuses={campuses} canEdit={canEdit} canArchive={canArchive} />
    </div>
  );
}
