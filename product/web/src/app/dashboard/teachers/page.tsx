import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateTeacherDialog, EditTeacherDialog } from "./teacher-dialogs";
import { ArchiveTeacherButton } from "./archive-teacher-button";

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

export default async function TeachersPage() {
  const [teachers, users] = await Promise.all([
    apiRequest<Teacher[]>("/api/v1/teachers"),
    apiRequest<UserWithRoles[]>("/api/v1/users"),
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
        action={<CreateTeacherDialog eligibleUsers={eligibleUsers} />}
      />

      {teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No teachers yet. Click "Add teacher" to create a profile.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee code</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.user.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{teacher.employeeCode ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{teacher.qualification ?? "—"}</TableCell>
                  <TableCell>
                    {teacher.status === "ARCHIVED" ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {teacher.status === "ACTIVE" && (
                      <>
                        <EditTeacherDialog teacher={teacher} />
                        <ArchiveTeacherButton id={teacher.id} name={teacher.user.fullName} />
                      </>
                    )}
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
