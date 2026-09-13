import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { assertCampusLimit } from "../../lib/licenseLimits.js";

async function requireInstitute() {
  const institute = await prisma.institute.findFirst();
  if (!institute) {
    throw new HttpError(409, "INSTITUTE_NOT_CONFIGURED", "Configure the institute before adding campuses");
  }
  return institute;
}

export async function listCampuses(campusIdIn?: string[]) {
  return prisma.campus.findMany({
    where: campusIdIn ? { id: { in: campusIdIn } } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function createCampus(input: { name: string; address?: string; phone?: string }, actorId: string) {
  const institute = await requireInstitute();
  await assertCampusLimit();

  const campus = await prisma.campus.create({ data: { ...input, instituteId: institute.id } });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Campus",
    recordId: campus.id,
    newValue: { name: campus.name },
  });

  return campus;
}

export async function updateCampus(
  campusId: string,
  input: Partial<{ name: string; address: string; phone: string }>,
  actorId: string
) {
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) throw new HttpError(404, "CAMPUS_NOT_FOUND", "Campus not found");
  if (campus.archivedAt) throw new HttpError(409, "CAMPUS_ARCHIVED", "Cannot edit an archived campus");

  const updated = await prisma.campus.update({ where: { id: campusId }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Campus",
    recordId: campusId,
    oldValue: { name: campus.name, address: campus.address, phone: campus.phone },
    newValue: { name: updated.name, address: updated.address, phone: updated.phone },
  });

  return updated;
}

// Spec's business rule is "cannot delete campus with active students/staff."
// Student/Staff don't exist until Phase 2, so the closest available proxy
// today is: no active (non-archived) sections. Revisit once Phase 2 lands.
export async function archiveCampus(campusId: string, actorId: string) {
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) throw new HttpError(404, "CAMPUS_NOT_FOUND", "Campus not found");
  if (campus.archivedAt) throw new HttpError(409, "CAMPUS_ALREADY_ARCHIVED", "Campus is already archived");

  const activeSection = await prisma.section.findFirst({ where: { campusId, archivedAt: null } });
  if (activeSection) {
    throw new HttpError(409, "CAMPUS_HAS_ACTIVE_SECTIONS", "Cannot archive a campus with active sections");
  }

  const updated = await prisma.campus.update({ where: { id: campusId }, data: { archivedAt: new Date() } });

  await writeAuditLog({
    actorId,
    action: "ARCHIVE",
    resource: "Campus",
    recordId: campusId,
    newValue: { archivedAt: updated.archivedAt },
  });

  return updated;
}
