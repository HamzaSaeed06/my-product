import { mockStudents, type Student } from "./students";
import { mockClasses } from "./classes";

export interface Section {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  capacity: number | null;
  archived: boolean;
}

// A Section is the Class × Campus × Academic Year join row — the concrete,
// enrollable instance of a class catalog entry at one campus for one year.
// All three FKs are immutable after creation (per the real backend); only
// name/capacity are editable.
export const mockSections: Section[] = [
  { id: "sec_1", name: "A", classId: "cls_3", campusId: "cmp_main", academicYearId: "ay_2026", capacity: 35, archived: false },
  { id: "sec_2", name: "B", classId: "cls_3", campusId: "cmp_main", academicYearId: "ay_2026", capacity: 35, archived: false },
  { id: "sec_3", name: "C", classId: "cls_3", campusId: "cmp_main", academicYearId: "ay_2026", capacity: 30, archived: false },
  { id: "sec_4", name: "A", classId: "cls_5", campusId: "cmp_main", academicYearId: "ay_2026", capacity: 32, archived: false },
  { id: "sec_5", name: "B", classId: "cls_5", campusId: "cmp_main", academicYearId: "ay_2026", capacity: 32, archived: false },
  { id: "sec_6", name: "A", classId: "cls_1", campusId: "cmp_north", academicYearId: "ay_2026", capacity: 28, archived: false },
  { id: "sec_7", name: "A", classId: "cls_2", campusId: "cmp_north", academicYearId: "ay_2026", capacity: 28, archived: false },
  { id: "sec_8", name: "A", classId: "cls_4", campusId: "cmp_riverside", academicYearId: "ay_2026", capacity: 30, archived: false },
  { id: "sec_9", name: "A", classId: "cls_montessori", campusId: "cmp_hilltop", academicYearId: "ay_2026", capacity: 20, archived: false },
  { id: "sec_10", name: "A", classId: "cls_3", campusId: "cmp_main", academicYearId: "ay_2025", capacity: 35, archived: true },
];

// The Student model (students.ts) carries flat display fields
// (className/section/campusId) rather than a sectionId FK — this bridges
// the two for any page that needs "who's actually in this section"
// (attendance rosters, curriculum progress) without duplicating a class-
// name lookup at every call site.
export function getSectionRoster(sectionId: string): Student[] {
  const section = mockSections.find((s) => s.id === sectionId);
  if (!section) return [];
  const className = mockClasses.find((c) => c.id === section.classId)?.name;
  return mockStudents.filter(
    (s) => s.campusId === section.campusId && s.className === className && s.section === section.name,
  );
}
