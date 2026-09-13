export type CanonicalKey = "CLASS" | "SECTION" | "SUBJECT" | "CAMPUS" | "TEACHER" | "ENROLLMENT";

export interface TerminologyOverride {
  canonicalKey: CanonicalKey;
  singularLabel: string;
  pluralLabel: string;
}

// Canonical DB/API/permission names never change — only the displayed
// label. Institution-type presets seed once at institute creation, freely
// editable afterward. This institute is type SCHOOL, so it's on the
// School preset (Class/Section/Subject) rather than the Academy/Coaching
// preset (Program/Batch/Course).
export const mockTerminology: TerminologyOverride[] = [
  { canonicalKey: "CLASS", singularLabel: "Class", pluralLabel: "Classes" },
  { canonicalKey: "SECTION", singularLabel: "Section", pluralLabel: "Sections" },
  { canonicalKey: "SUBJECT", singularLabel: "Subject", pluralLabel: "Subjects" },
  { canonicalKey: "CAMPUS", singularLabel: "Campus", pluralLabel: "Campuses" },
  { canonicalKey: "TEACHER", singularLabel: "Teacher", pluralLabel: "Teachers" },
  { canonicalKey: "ENROLLMENT", singularLabel: "Enrollment", pluralLabel: "Enrollments" },
];
