import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

async function requireInstitute() {
  const institute = await prisma.institute.findFirst();
  if (!institute) {
    throw new HttpError(409, "INSTITUTE_NOT_CONFIGURED", "Configure the institute before adding academic years");
  }
  return institute;
}

export async function listAcademicYears() {
  return prisma.academicYear.findMany({ orderBy: { startDate: "desc" } });
}

// Academic years are deliberately allowed to overlap (spec: session-based
// institutes) — no date-range uniqueness check here.
export async function createAcademicYear(
  input: { name: string; startDate: Date; endDate: Date },
  actorId: string
) {
  const institute = await requireInstitute();

  if (input.endDate <= input.startDate) {
    throw new HttpError(400, "INVALID_DATE_RANGE", "endDate must be after startDate");
  }

  const existing = await prisma.academicYear.findUnique({
    where: { instituteId_name: { instituteId: institute.id, name: input.name } },
  });
  if (existing) {
    throw new HttpError(409, "ACADEMIC_YEAR_EXISTS", `An academic year named "${input.name}" already exists`);
  }

  const academicYear = await prisma.academicYear.create({ data: { ...input, instituteId: institute.id } });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "AcademicYear",
    recordId: academicYear.id,
    newValue: { name: academicYear.name, startDate: academicYear.startDate, endDate: academicYear.endDate },
  });

  return academicYear;
}

export async function updateAcademicYear(
  id: string,
  input: Partial<{ name: string; startDate: Date; endDate: Date }>,
  actorId: string
) {
  const academicYear = await prisma.academicYear.findUnique({ where: { id } });
  if (!academicYear) throw new HttpError(404, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");
  if (academicYear.status === "CLOSED") {
    throw new HttpError(409, "ACADEMIC_YEAR_CLOSED", "Closed academic years are read-only");
  }

  const startDate = input.startDate ?? academicYear.startDate;
  const endDate = input.endDate ?? academicYear.endDate;
  if (endDate <= startDate) {
    throw new HttpError(400, "INVALID_DATE_RANGE", "endDate must be after startDate");
  }

  const updated = await prisma.academicYear.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "AcademicYear",
    recordId: id,
    oldValue: { name: academicYear.name, startDate: academicYear.startDate, endDate: academicYear.endDate },
    newValue: { name: updated.name, startDate: updated.startDate, endDate: updated.endDate },
  });

  return updated;
}

export async function closeAcademicYear(id: string, actorId: string) {
  const academicYear = await prisma.academicYear.findUnique({ where: { id } });
  if (!academicYear) throw new HttpError(404, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");
  if (academicYear.status === "CLOSED") {
    throw new HttpError(409, "ACADEMIC_YEAR_ALREADY_CLOSED", "Academic year is already closed");
  }

  const updated = await prisma.academicYear.update({
    where: { id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await writeAuditLog({
    actorId,
    action: "CLOSE",
    resource: "AcademicYear",
    recordId: id,
    oldValue: { status: "ACTIVE" },
    newValue: { status: "CLOSED", closedAt: updated.closedAt },
  });

  return updated;
}
