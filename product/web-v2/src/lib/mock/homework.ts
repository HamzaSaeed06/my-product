export type HomeworkStatus = "DRAFT" | "PUBLISHED";

// Replaces the old single documentId field — many-to-one, and attachments
// can be added after creation too, not only at create time.
export interface HomeworkAttachment {
  id: string;
  homeworkId: string;
  fileName: string;
}

export interface Homework {
  id: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: HomeworkStatus;
  publishedAt: string | null;
  archivedAt: string | null;
}

// Publish is its own action/permission (homework.publish), separate from
// create/edit — only DRAFT rows show a Publish button.
export const mockHomework: Homework[] = [
  { id: "hw_1", subjectId: "sub_math", classId: "cls_3", sectionId: "sec_1", teacherId: "tch_1", title: "Multiplication practice sheet", description: "Complete exercises 1-20 on page 34, tables of 6, 7 and 8.", dueDate: "2026-09-17", status: "PUBLISHED", publishedAt: "2026-09-13T14:00:00", archivedAt: null },
  { id: "hw_2", subjectId: "sub_english", classId: "cls_1", sectionId: "sec_6", teacherId: "tch_3", title: "Reading comprehension — 'The Lost Kite'", description: "Read the passage and answer the five questions in full sentences.", dueDate: "2026-09-16", status: "PUBLISHED", publishedAt: "2026-09-12T11:00:00", archivedAt: null },
  { id: "hw_3", subjectId: "sub_science", classId: "cls_5", sectionId: "sec_4", teacherId: "tch_2", title: "Diagram: parts of a plant", description: null, dueDate: "2026-09-20", status: "DRAFT", publishedAt: null, archivedAt: null },
  { id: "hw_4", subjectId: "sub_math", classId: "cls_3", sectionId: "sec_2", teacherId: "tch_1", title: "Fractions worksheet", description: "Introductory fractions — for after this week's lesson.", dueDate: "2026-09-19", status: "DRAFT", publishedAt: null, archivedAt: null },
  // Published — the one sec_2 sees in the Portal batch's Parent/Student
  // homework view by default (hw_4 above is deliberately still a draft,
  // so the Teacher portal's own list shows one of each status).
  { id: "hw_5", subjectId: "sub_math", classId: "cls_3", sectionId: "sec_2", teacherId: "tch_1", title: "Multiplication tables quiz prep", description: "Revise tables 6-8 ahead of Friday's quiz.", dueDate: "2026-09-18", status: "PUBLISHED", publishedAt: "2026-09-13T09:00:00", archivedAt: null },
];

export const mockHomeworkAttachments: HomeworkAttachment[] = [
  { id: "hwa_1", homeworkId: "hw_1", fileName: "multiplication-sheet.pdf" },
  { id: "hwa_2", homeworkId: "hw_2", fileName: "the-lost-kite.pdf" },
  { id: "hwa_3", homeworkId: "hw_2", fileName: "comprehension-questions.docx" },
];
