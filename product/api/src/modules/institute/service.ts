import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { InstituteType } from "@prisma/client";
import { resolveTerminology, setTerminologyOverride, seedTerminologyPresetForType, naivePlural } from "../../lib/terminology.js";
import { setInstituteFeatureConfig } from "../../lib/featureConfig.js";

// Phase 12 Gap 1's legacy shim: the old fixed studentLabel/teacherLabel/
// classLabel/sectionLabel API shape stays byte-for-byte compatible (same
// field names, same flat shape on `settings`) even though the real storage
// is now the generic TerminologyOverride table — no frontend change
// needed for the existing settings form to keep working.
function legacyLabelFields(terminology: Awaited<ReturnType<typeof resolveTerminology>>) {
  return {
    studentLabel: terminology.STUDENT.singular,
    teacherLabel: terminology.TEACHER.singular,
    classLabel: terminology.CLASS.singular,
    sectionLabel: terminology.SECTION.singular,
  };
}

// Singleton by convention — one deployment, one institute. Enforced here
// (refuse a second create), not by a DB constraint (Postgres has no clean
// "at most one row" constraint).
export async function getInstitute() {
  const institute = await prisma.institute.findFirst({ include: { settings: true } });
  if (!institute?.settings) return institute;
  const terminology = await resolveTerminology(institute.id);
  return { ...institute, settings: { ...institute.settings, ...legacyLabelFields(terminology) } };
}

export async function createInstitute(
  input: { name: string; type?: InstituteType; logoUrl?: string; address?: string; phone?: string; email?: string; website?: string },
  actorId: string
) {
  const existing = await prisma.institute.findFirst();
  if (existing) {
    throw new HttpError(409, "INSTITUTE_ALREADY_EXISTS", "An institute is already configured for this deployment");
  }

  // Phase 12 Gap 4: a single-campus institution must never be forced
  // through a "create your first campus" step before anything else works —
  // invisible plumbing for the common case, renameable like any campus.
  const institute = await prisma.institute.create({
    data: { ...input, settings: { create: {} }, campuses: { create: [{ name: "Main Campus" }] } },
    include: { settings: true, campuses: true },
  });

  // Phase 12 Gap 1: institution-type presets, editable after the fact —
  // a one-time seed, not a second source of truth. SCHOOL has no preset
  // entry (the English default already IS the school preset), so this is
  // a no-op for the common case.
  await seedTerminologyPresetForType(institute.id, institute.type);

  // Phase 12 Gap 3: a concrete proof of the generic FeatureConfig system —
  // which staff check-in methods (Phase 11 Phase A3) are allowed,
  // institute-wide by default, campuses free to narrow it further.
  // Everything allowed by default preserves today's behavior exactly for
  // every institute that never touches this setting.
  await setInstituteFeatureConfig(institute.id, "ATTENDANCE_CHECKIN_METHODS", "INSTITUTE_DEFAULT", {
    allowedMethods: ["QR", "MANUAL", "REMOTE_APPROVED"],
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Institute",
    recordId: institute.id,
    newValue: { name: institute.name, type: institute.type },
  });

  return institute;
}

export async function updateInstitute(
  input: Partial<{
    name: string;
    type: InstituteType;
    logoUrl: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  }>,
  actorId: string
) {
  const institute = await prisma.institute.findFirst();
  if (!institute) throw new HttpError(404, "INSTITUTE_NOT_CONFIGURED", "No institute has been configured yet");

  const updated = await prisma.institute.update({ where: { id: institute.id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Institute",
    recordId: institute.id,
    oldValue: institute,
    newValue: updated,
  });

  return updated;
}

export async function updateInstituteSettings(
  input: Partial<{
    timezone: string;
    locale: string;
    currency: string;
    studentLabel: string;
    teacherLabel: string;
    classLabel: string;
    sectionLabel: string;
  }>,
  actorId: string
) {
  const institute = await prisma.institute.findFirst({ include: { settings: true } });
  if (!institute?.settings) {
    throw new HttpError(404, "INSTITUTE_NOT_CONFIGURED", "No institute has been configured yet");
  }

  const oldTerminology = await resolveTerminology(institute.id);
  const { studentLabel, teacherLabel, classLabel, sectionLabel, ...columnInput } = input;

  // Phase 12 Gap 1: the 4 legacy label fields no longer map to real
  // columns — each becomes a TerminologyOverride write instead. The
  // plural is approximated (naivePlural) since this old API never
  // captured one; the generic PUT /terminology/:key endpoint lets a
  // caller set an exact plural directly.
  if (studentLabel !== undefined) await setTerminologyOverride(institute.id, "STUDENT", { singular: studentLabel, plural: naivePlural(studentLabel) });
  if (teacherLabel !== undefined) await setTerminologyOverride(institute.id, "TEACHER", { singular: teacherLabel, plural: naivePlural(teacherLabel) });
  if (classLabel !== undefined) await setTerminologyOverride(institute.id, "CLASS", { singular: classLabel, plural: naivePlural(classLabel) });
  if (sectionLabel !== undefined) await setTerminologyOverride(institute.id, "SECTION", { singular: sectionLabel, plural: naivePlural(sectionLabel) });

  const updatedColumns =
    Object.keys(columnInput).length > 0
      ? await prisma.instituteSettings.update({ where: { id: institute.settings.id }, data: columnInput })
      : institute.settings;

  const newTerminology = await resolveTerminology(institute.id);
  const merged = { ...updatedColumns, ...legacyLabelFields(newTerminology) };

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "InstituteSettings",
    recordId: institute.settings.id,
    oldValue: { ...institute.settings, ...legacyLabelFields(oldTerminology) },
    newValue: merged,
  });

  return merged;
}
