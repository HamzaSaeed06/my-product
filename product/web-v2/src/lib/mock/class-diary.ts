// Deliberately lighter than Homework: no attachments, no draft/publish
// lifecycle — just a one-line daily log per section, optionally tagged to
// a subject. class_diary.create is reused for create, update, AND archive
// in the real backend (confirmed from routes.ts) — there's no separate
// .edit permission the way most other modules have one.
export interface ClassDiaryEntry {
  id: string;
  sectionId: string;
  subjectId: string | null;
  teacherId: string;
  date: string;
  note: string;
  archivedAt: string | null;
}

export const mockClassDiary: ClassDiaryEntry[] = [
  { id: "cd_1", sectionId: "sec_1", subjectId: "sub_math", teacherId: "tch_1", date: "2026-09-14", note: "Covered multiplication tables 6-8, class was attentive. Started fractions warm-up in the last 10 minutes.", archivedAt: null },
  { id: "cd_2", sectionId: "sec_1", subjectId: null, teacherId: "tch_1", date: "2026-09-14", note: "Fire drill at 11am — lost roughly 15 minutes of class time, adjusted homework due date accordingly.", archivedAt: null },
  { id: "cd_3", sectionId: "sec_6", subjectId: "sub_english", teacherId: "tch_3", date: "2026-09-13", note: "Read 'The Lost Kite' aloud as a class, discussed vocabulary. Assigned comprehension questions as homework.", archivedAt: null },
  { id: "cd_4", sectionId: "sec_4", subjectId: "sub_science", teacherId: "tch_2", date: "2026-09-12", note: "Plant parts lesson — brought in real leaves and flowers for the diagram activity.", archivedAt: null },
];
