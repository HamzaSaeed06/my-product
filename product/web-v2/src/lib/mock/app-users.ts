export interface UserRoleGrant {
  userRoleId: string;
  roleId: string;
  roleName: string;
  /** null = all campuses (only valid for roles that don't requireCampus). */
  campusId: string | null;
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: UserRoleGrant[];
}

// A User is the login identity — a Teacher/Parent profile is a separate
// record optionally linked to one (see teachers.ts). Role is never a field
// on the user; it's a set of UserRole grants, each optionally scoped to a
// campus, which is why "usr_incharge_2" below correctly appears with zero
// UserRole rows tied to a Teacher/Parent profile of its own.
export const mockAppUsers: AppUser[] = [
  {
    id: "usr_super_admin",
    fullName: "Ayesha Raza",
    email: "ayesha.raza@risecampus.edu",
    isActive: true,
    createdAt: "2024-06-01",
    roles: [{ userRoleId: "ur_1", roleId: "role_super_admin", roleName: "Super Admin", campusId: null }],
  },
  {
    id: "usr_head_main",
    fullName: "Bilal Ahmed",
    email: "bilal.ahmed@risecampus.edu",
    isActive: true,
    createdAt: "2024-07-15",
    roles: [{ userRoleId: "ur_2", roleId: "role_campus_head", roleName: "Campus Head", campusId: "cmp_main" }],
  },
  {
    id: "usr_head_north",
    fullName: "Sana Tariq",
    email: "sana.tariq@risecampus.edu",
    isActive: true,
    createdAt: "2024-08-01",
    roles: [{ userRoleId: "ur_3", roleId: "role_campus_head", roleName: "Campus Head", campusId: "cmp_north" }],
  },
  {
    id: "usr_incharge_1",
    fullName: "Hassan Iqbal",
    email: "hassan.iqbal@risecampus.edu",
    isActive: true,
    createdAt: "2025-01-10",
    roles: [{ userRoleId: "ur_4", roleId: "role_incharge", roleName: "Incharge", campusId: "cmp_main" }],
  },
  {
    id: "usr_incharge_2",
    fullName: "Mahnoor Sheikh",
    email: "mahnoor.sheikh@risecampus.edu",
    isActive: true,
    createdAt: "2025-02-14",
    roles: [{ userRoleId: "ur_5", roleId: "role_incharge", roleName: "Incharge", campusId: "cmp_main" }],
  },
  {
    id: "usr_office_1",
    fullName: "Danish Malik",
    email: "danish.malik@risecampus.edu",
    isActive: true,
    createdAt: "2025-03-01",
    roles: [{ userRoleId: "ur_6", roleId: "role_office", roleName: "Office", campusId: "cmp_main" }],
  },
  {
    id: "usr_teacher_1",
    fullName: "Iqra Nadeem",
    email: "iqra.nadeem@risecampus.edu",
    isActive: true,
    createdAt: "2025-04-01",
    roles: [{ userRoleId: "ur_7", roleId: "role_teacher", roleName: "Teacher", campusId: "cmp_main" }],
  },
  {
    id: "usr_teacher_2",
    fullName: "Usman Ghani",
    email: "usman.ghani@risecampus.edu",
    isActive: true,
    createdAt: "2025-04-10",
    roles: [{ userRoleId: "ur_8", roleId: "role_teacher", roleName: "Teacher", campusId: "cmp_main" }],
  },
  {
    id: "usr_teacher_3",
    fullName: "Fatima Aslam",
    email: "fatima.aslam@risecampus.edu",
    isActive: true,
    createdAt: "2025-05-05",
    roles: [{ userRoleId: "ur_9", roleId: "role_teacher", roleName: "Teacher", campusId: "cmp_north" }],
  },
  {
    // Holds the TEACHER role but has no Teacher profile yet — this is
    // exactly who should show up in the Teachers "create" picker.
    id: "usr_teacher_4",
    fullName: "Talha Rashid",
    email: "talha.rashid@risecampus.edu",
    isActive: true,
    createdAt: "2026-08-20",
    roles: [{ userRoleId: "ur_10", roleId: "role_teacher", roleName: "Teacher", campusId: "cmp_riverside" }],
  },
  {
    id: "usr_disabled_1",
    fullName: "Kamran Yousuf",
    email: "kamran.yousuf@risecampus.edu",
    isActive: false,
    createdAt: "2024-09-01",
    roles: [{ userRoleId: "ur_11", roleId: "role_office", roleName: "Office", campusId: "cmp_hilltop" }],
  },
];
