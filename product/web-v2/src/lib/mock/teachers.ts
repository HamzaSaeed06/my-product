export interface TeacherProfile {
  id: string;
  userId: string;
  employeeCode: string | null;
  qualification: string | null;
  phone: string | null;
  joiningDate: string | null;
  status: "ACTIVE" | "ARCHIVED";
}

// 1:1 with a User that already holds the TEACHER role — creating a
// profile never creates the user or assigns the role, that happens on the
// Users page first. usr_teacher_4 deliberately has no profile here yet.
export const mockTeachers: TeacherProfile[] = [
  { id: "tch_1", userId: "usr_teacher_1", employeeCode: "T-1001", qualification: "M.Ed", phone: "0301-1234567", joiningDate: "2025-04-01", status: "ACTIVE" },
  { id: "tch_2", userId: "usr_teacher_2", employeeCode: "T-1002", qualification: "BSc Mathematics", phone: "0302-2345678", joiningDate: "2025-04-10", status: "ACTIVE" },
  { id: "tch_3", userId: "usr_teacher_3", employeeCode: "T-1003", qualification: "MA English", phone: "0303-3456789", joiningDate: "2025-05-05", status: "ACTIVE" },
];
