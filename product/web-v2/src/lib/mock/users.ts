export type StaffRole = "SUPER_ADMIN" | "CAMPUS_HEAD" | "INCHARGE" | "OFFICE" | "TEACHER";

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  campusId?: string;
}

// A small directory covering every role a picker in this batch needs to
// filter by (Incharge Scopes needs INCHARGE users; Delegations needs any
// staff role as a delegate).
export const mockStaffUsers: StaffUser[] = [
  { id: "usr_super_admin", fullName: "Ayesha Raza", email: "ayesha.raza@risecampus.edu", role: "SUPER_ADMIN" },
  { id: "usr_head_main", fullName: "Bilal Ahmed", email: "bilal.ahmed@risecampus.edu", role: "CAMPUS_HEAD", campusId: "cmp_main" },
  { id: "usr_head_north", fullName: "Sana Tariq", email: "sana.tariq@risecampus.edu", role: "CAMPUS_HEAD", campusId: "cmp_north" },
  { id: "usr_incharge_1", fullName: "Hassan Iqbal", email: "hassan.iqbal@risecampus.edu", role: "INCHARGE", campusId: "cmp_main" },
  { id: "usr_incharge_2", fullName: "Mahnoor Sheikh", email: "mahnoor.sheikh@risecampus.edu", role: "INCHARGE", campusId: "cmp_main" },
  { id: "usr_incharge_3", fullName: "Omar Farooq", email: "omar.farooq@risecampus.edu", role: "INCHARGE", campusId: "cmp_north" },
  { id: "usr_incharge_4", fullName: "Zara Khan", email: "zara.khan@risecampus.edu", role: "INCHARGE", campusId: "cmp_riverside" },
  { id: "usr_office_1", fullName: "Danish Malik", email: "danish.malik@risecampus.edu", role: "OFFICE", campusId: "cmp_main" },
];

export function getInchargeUsers(): StaffUser[] {
  return mockStaffUsers.filter((u) => u.role === "INCHARGE");
}
