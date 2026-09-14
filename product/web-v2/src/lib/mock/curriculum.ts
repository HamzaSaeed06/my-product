export interface CurriculumTopic {
  id: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
  topic: string;
  sortOrder: number;
  expectedCompletionDate: string | null;
  archivedAt: string | null;
}

// Scoped to subject+class+year, shared across every section of that class
// (syllabus doesn't vary by section) — completion does, tracked separately
// below per [curriculumId, sectionId].
export interface CurriculumProgress {
  id: string;
  curriculumId: string;
  sectionId: string;
  completedAt: string | null;
  completedById: string | null;
  notes: string | null;
}

// curriculum.create (add a topic) is a separate permission from
// curriculum.edit (update/archive/mark progress) — Incharge has edit but
// not create, confirmed from the real backend's routes.
export const mockCurriculumTopics: CurriculumTopic[] = [
  { id: "cur_1", subjectId: "sub_math", classId: "cls_3", academicYearId: "ay_2026", topic: "Whole numbers up to 10,000", sortOrder: 1, expectedCompletionDate: "2026-07-15", archivedAt: null },
  { id: "cur_2", subjectId: "sub_math", classId: "cls_3", academicYearId: "ay_2026", topic: "Addition and subtraction with regrouping", sortOrder: 2, expectedCompletionDate: "2026-08-01", archivedAt: null },
  { id: "cur_3", subjectId: "sub_math", classId: "cls_3", academicYearId: "ay_2026", topic: "Multiplication tables 2-12", sortOrder: 3, expectedCompletionDate: "2026-08-20", archivedAt: null },
  { id: "cur_4", subjectId: "sub_math", classId: "cls_3", academicYearId: "ay_2026", topic: "Introduction to fractions", sortOrder: 4, expectedCompletionDate: "2026-09-10", archivedAt: null },
  { id: "cur_5", subjectId: "sub_math", classId: "cls_3", academicYearId: "ay_2026", topic: "Basic geometry — shapes and angles", sortOrder: 5, expectedCompletionDate: "2026-09-30", archivedAt: null },
];

// Sections sec_1/sec_2/sec_3 are all Grade 3 (cls_3) — the three sections
// this class's syllabus is tracked against.
export const mockCurriculumProgress: CurriculumProgress[] = [
  { id: "cp_1", curriculumId: "cur_1", sectionId: "sec_1", completedAt: "2026-07-12", completedById: "tch_1", notes: null },
  { id: "cp_2", curriculumId: "cur_1", sectionId: "sec_2", completedAt: "2026-07-14", completedById: "tch_1", notes: null },
  { id: "cp_3", curriculumId: "cur_1", sectionId: "sec_3", completedAt: "2026-07-18", completedById: "tch_1", notes: "Ran two days over — extra revision needed." },
  { id: "cp_4", curriculumId: "cur_2", sectionId: "sec_1", completedAt: "2026-07-30", completedById: "tch_1", notes: null },
  { id: "cp_5", curriculumId: "cur_2", sectionId: "sec_2", completedAt: "2026-08-02", completedById: "tch_1", notes: null },
  { id: "cp_6", curriculumId: "cur_2", sectionId: "sec_3", completedAt: null, completedById: null, notes: null },
  { id: "cp_7", curriculumId: "cur_3", sectionId: "sec_1", completedAt: "2026-08-19", completedById: "tch_1", notes: null },
  { id: "cp_8", curriculumId: "cur_3", sectionId: "sec_2", completedAt: null, completedById: null, notes: null },
  { id: "cp_9", curriculumId: "cur_3", sectionId: "sec_3", completedAt: null, completedById: null, notes: null },
  { id: "cp_10", curriculumId: "cur_4", sectionId: "sec_1", completedAt: null, completedById: null, notes: null },
  { id: "cp_11", curriculumId: "cur_4", sectionId: "sec_2", completedAt: null, completedById: null, notes: null },
  { id: "cp_12", curriculumId: "cur_4", sectionId: "sec_3", completedAt: null, completedById: null, notes: null },
];
