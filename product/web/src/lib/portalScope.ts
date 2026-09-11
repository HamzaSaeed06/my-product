import "server-only";
import { apiRequest } from "./apiClient";

export interface TeacherAssignment {
  id: string;
  subject: { id: string; name: string };
  klass: { id: string; name: string };
  section: { id: string; name: string };
  academicYear: { id: string; name: string };
}

// Teacher Portal MVP: one active section at a time, picked via ?sectionId=
// or defaulted to the teacher's first assignment — a real "class switcher"
// (like Parent's child switcher) is a natural follow-up once a teacher
// with >1 section actually needs it.
export async function getTeacherAssignments(teacherId: string): Promise<TeacherAssignment[]> {
  return apiRequest<TeacherAssignment[]>(`/api/v1/teacher-assignments?teacherId=${teacherId}`);
}

interface StudentEnrollment {
  id: string;
  status: string;
  academicYear: { id: string; name: string };
  klass: { id: string; name: string };
  section: { id: string; name: string };
}

interface StudentDetail {
  id: string;
  fullName: string;
  studentCode: string;
  enrollments: StudentEnrollment[];
}

// A student's most recent ACTIVE enrollment — used by both the Student
// Portal (their own id) and the Parent Portal (a chosen child's id) to
// resolve which section/academic year to show timetable/homework for.
export async function getActiveEnrollment(studentId: string): Promise<StudentEnrollment | null> {
  const student = await apiRequest<StudentDetail>(`/api/v1/students/${studentId}`);
  return student.enrollments.find((e) => e.status === "ACTIVE") ?? null;
}
