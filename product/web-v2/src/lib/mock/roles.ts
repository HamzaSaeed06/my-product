export interface RoleDef {
  id: string;
  name: string;
  systemKey: string | null;
  requiresCampus: boolean;
}

// 7 core system roles (stable systemKey, never renamed even if the
// display name is) plus room for institute-defined custom roles (no
// systemKey — a pure permission bag). CAMPUS_HEAD and OFFICE require a
// campus on assignment; the backend refuses to grant them without one.
export const mockRoles: RoleDef[] = [
  { id: "role_super_admin", name: "Super Admin", systemKey: "SUPER_ADMIN", requiresCampus: false },
  { id: "role_campus_head", name: "Campus Head", systemKey: "CAMPUS_HEAD", requiresCampus: true },
  { id: "role_incharge", name: "Incharge", systemKey: "INCHARGE", requiresCampus: false },
  { id: "role_office", name: "Office", systemKey: "OFFICE", requiresCampus: true },
  { id: "role_teacher", name: "Teacher", systemKey: "TEACHER", requiresCampus: false },
  { id: "role_parent", name: "Parent", systemKey: "PARENT", requiresCampus: false },
  { id: "role_student", name: "Student", systemKey: "STUDENT", requiresCampus: false },
];
