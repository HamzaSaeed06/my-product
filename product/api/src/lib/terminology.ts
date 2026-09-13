import type { InstituteType } from "@prisma/client";
import { prisma } from "./prisma.js";

// Phase 12 Gap 1 — canonical entity keys UI labels can be overridden for.
// The set is fixed (it maps 1:1 to real entities/pages), but the label is
// always freely editable per institute regardless of type.
export const TERMINOLOGY_CANONICAL_KEYS = ["STUDENT", "TEACHER", "CLASS", "SECTION", "SUBJECT", "CAMPUS", "ENROLLMENT"] as const;
export type TerminologyCanonicalKey = (typeof TERMINOLOGY_CANONICAL_KEYS)[number];

export interface TerminologyLabel {
  singular: string;
  plural: string;
}

const ENGLISH_DEFAULTS: Record<TerminologyCanonicalKey, TerminologyLabel> = {
  STUDENT: { singular: "Student", plural: "Students" },
  TEACHER: { singular: "Teacher", plural: "Teachers" },
  CLASS: { singular: "Class", plural: "Classes" },
  SECTION: { singular: "Section", plural: "Sections" },
  SUBJECT: { singular: "Subject", plural: "Subjects" },
  CAMPUS: { singular: "Campus", plural: "Campuses" },
  ENROLLMENT: { singular: "Enrollment", plural: "Enrollments" },
};

// Seeded once at institute-creation time (see institute/service.ts's
// createInstitute), never re-applied automatically afterward — Super Admin
// can edit any label afterward same as any other setting. SCHOOL has no
// entry: the plain English default already IS the school preset, so zero
// override rows are the correct result for it.
const TYPE_PRESETS: Partial<Record<InstituteType, Partial<Record<TerminologyCanonicalKey, TerminologyLabel>>>> = {
  ACADEMY: {
    CLASS: { singular: "Program", plural: "Programs" },
    SECTION: { singular: "Batch", plural: "Batches" },
    SUBJECT: { singular: "Course", plural: "Courses" },
  },
  COACHING_CENTER: {
    CLASS: { singular: "Program", plural: "Programs" },
    SECTION: { singular: "Batch", plural: "Batches" },
    SUBJECT: { singular: "Course", plural: "Courses" },
  },
  INSTITUTE: {
    CLASS: { singular: "Program", plural: "Programs" },
    SECTION: { singular: "Group", plural: "Groups" },
    SUBJECT: { singular: "Module", plural: "Modules" },
  },
};

export type ResolvedTerminology = Record<TerminologyCanonicalKey, TerminologyLabel>;

// The one place every consumer (frontend pages, once they adopt this;
// institute/service.ts's legacy 4-field shim) reads terminology through —
// never read TerminologyOverride rows directly elsewhere. Falls back to
// the plain English default for any key with no override row.
export async function resolveTerminology(instituteId: string): Promise<ResolvedTerminology> {
  const overrides = await prisma.terminologyOverride.findMany({ where: { instituteId } });
  const overrideByKey = new Map(overrides.map((o) => [o.canonicalKey, { singular: o.singularLabel, plural: o.pluralLabel }]));

  const resolved = {} as ResolvedTerminology;
  for (const key of TERMINOLOGY_CANONICAL_KEYS) {
    resolved[key] = overrideByKey.get(key) ?? ENGLISH_DEFAULTS[key];
  }
  return resolved;
}

export async function setTerminologyOverride(
  instituteId: string,
  canonicalKey: TerminologyCanonicalKey,
  label: TerminologyLabel
) {
  return prisma.terminologyOverride.upsert({
    where: { instituteId_canonicalKey: { instituteId, canonicalKey } },
    update: { singularLabel: label.singular, pluralLabel: label.plural },
    create: { instituteId, canonicalKey, singularLabel: label.singular, pluralLabel: label.plural },
  });
}

export async function seedTerminologyPresetForType(instituteId: string, type: InstituteType): Promise<void> {
  const preset = TYPE_PRESETS[type];
  if (!preset) return;
  for (const [key, label] of Object.entries(preset) as [TerminologyCanonicalKey, TerminologyLabel][]) {
    await setTerminologyOverride(instituteId, key, label);
  }
}

// Rough heuristic ONLY for the legacy 4-field studentLabel/teacherLabel/
// classLabel/sectionLabel shim (institute/service.ts) — that API never
// captured a real plural, so this approximates one. The generic
// PUT /terminology/:key endpoint lets a caller set an exact plural
// directly instead of relying on this guess.
export function naivePlural(singular: string): string {
  if (/[sxz]$|[cs]h$/i.test(singular)) return `${singular}es`;
  if (/[^aeiou]y$/i.test(singular)) return `${singular.slice(0, -1)}ies`;
  return `${singular}s`;
}
