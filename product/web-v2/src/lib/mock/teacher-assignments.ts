export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  sectionId: string;
  archived: boolean;
}

// The many-to-many linking point: Teacher x Subject x Section (which
// itself implies Class/Campus/AcademicYear) — unique per that 3-way
// combination while active. Archiving preserves history rather than
// deleting the row.
export const mockTeacherAssignments: TeacherAssignment[] = [
  { id: "ta_1", teacherId: "tch_1", subjectId: "sub_math", sectionId: "sec_1", archived: false },
  { id: "ta_2", teacherId: "tch_1", subjectId: "sub_math", sectionId: "sec_2", archived: false },
  { id: "ta_3", teacherId: "tch_2", subjectId: "sub_science", sectionId: "sec_4", archived: false },
  { id: "ta_4", teacherId: "tch_3", subjectId: "sub_english", sectionId: "sec_6", archived: false },
  { id: "ta_5", teacherId: "tch_2", subjectId: "sub_computer", sectionId: "sec_1", archived: true },
];
