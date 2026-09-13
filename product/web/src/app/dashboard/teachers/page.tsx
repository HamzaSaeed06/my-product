import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateTeacherDialog } from "./teacher-dialogs";
import { TeachersTable } from "./teachers-table";

interface UserWithRoles {
  id: string;
  fullName: string;
  email: string;
  roles: { roleName: string }[];
}

interface Teacher {
  id: string;
  employeeCode: string | null;
  qualification: string | null;
  phone: string | null;
  status: "ACTIVE" | "ARCHIVED";
  user: { id: string; fullName: string; email: string };
}

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ campusId?: string }>;
}) {
  const { campusId } = await searchParams;

  // Mirrors teacher.create/edit/archive from routes.ts — Office/Incharge
  // hold teacher.view only (Incharge oversees existing teachers, doesn't
  // onboard them). /api/v1/users needs user.view, which neither holds
  // either — it's fetched solely to build the "link an existing user"
  // dropdown for Create, so skip it entirely when canCreate is false
  // rather than 403 the whole page.
  const permissions = (await getCurrentUser())?.permissions ?? [];
  const canCreate = permissions.includes("teacher.create");
  const canEdit = permissions.includes("teacher.edit");
  const canArchive = permissions.includes("teacher.archive");

  const [teachers, users] = await Promise.all([
    apiRequest<Teacher[]>(`/api/v1/teachers${campusId ? `?campusId=${campusId}` : ""}`),
    canCreate ? apiRequest<UserWithRoles[]>("/api/v1/users") : Promise.resolve<UserWithRoles[]>([]),
  ]);

  const teacherUserIds = new Set(teachers.map((t) => t.user.id));
  const eligibleUsers = users
    .filter((u) => u.roles.some((r) => r.roleName === "TEACHER") && !teacherUserIds.has(u.id))
    .map((u) => ({ id: u.id, name: u.fullName, email: u.email }));

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Teaching-staff profiles, linked to a user account with the TEACHER role."
        action={canCreate ? <CreateTeacherDialog eligibleUsers={eligibleUsers} /> : undefined}
      />

      <TeachersTable teachers={teachers} canEdit={canEdit} canArchive={canArchive} />
    </div>
  );
}
