import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateAcademicYearDialog } from "./academic-year-dialogs";
import { AcademicYearsTable } from "./academic-years-table";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
}

export default async function AcademicYearsPage() {
  // Mirrors academic_year.create/academic_year.edit/academic_year.close from routes.ts.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("academic_year.create");
  const canEdit = permissions.includes("academic_year.edit");
  const canClose = permissions.includes("academic_year.close");

  const years = await apiRequest<AcademicYear[]>("/api/v1/academic-years");

  return (
    <div>
      <PageHeader
        title="Academic Years"
        description="Sessions can overlap — this is deliberate, not a bug."
        action={canCreate ? <CreateAcademicYearDialog /> : undefined}
      />

      <AcademicYearsTable years={years} canEdit={canEdit} canClose={canClose} />
    </div>
  );
}
