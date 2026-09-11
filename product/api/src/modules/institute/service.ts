import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { InstituteType } from "@prisma/client";

// Singleton by convention — one deployment, one institute. Enforced here
// (refuse a second create), not by a DB constraint (Postgres has no clean
// "at most one row" constraint).
export async function getInstitute() {
  return prisma.institute.findFirst({ include: { settings: true } });
}

export async function createInstitute(
  input: { name: string; type?: InstituteType; logoUrl?: string; address?: string; phone?: string; email?: string; website?: string },
  actorId: string
) {
  const existing = await prisma.institute.findFirst();
  if (existing) {
    throw new HttpError(409, "INSTITUTE_ALREADY_EXISTS", "An institute is already configured for this deployment");
  }

  const institute = await prisma.institute.create({
    data: { ...input, settings: { create: {} } },
    include: { settings: true },
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

  const updated = await prisma.instituteSettings.update({
    where: { id: institute.settings.id },
    data: input,
  });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "InstituteSettings",
    recordId: institute.settings.id,
    oldValue: institute.settings,
    newValue: updated,
  });

  return updated;
}
