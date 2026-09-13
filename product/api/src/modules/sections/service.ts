import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listSections(filter: {
  classId?: string;
  campusId?: string;
  academicYearId?: string;
  campusIdIn?: string[];
  // Explicit section-id allow-list (Incharge scope). An empty array means
  // "this actor oversees no sections" → returns nothing, never everything.
  sectionIdIn?: string[];
}) {
  return prisma.section.findMany({
    where: {
      id: filter.sectionIdIn ? { in: filter.sectionIdIn } : undefined,
      classId: filter.classId,
      campusId: filter.campusIdIn ? { in: filter.campusIdIn } : filter.campusId,
      academicYearId: filter.academicYearId,
    },
    orderBy: { name: "asc" },
  });
}

// Thin getter for controllers that need to scope-check a section by id
// before editing/archiving it.
export async function getSectionCampusId(id: string): Promise<string> {
  const section = await prisma.section.findUnique({ where: { id }, select: { campusId: true } });
  if (!section) throw new HttpError(404, "SECTION_NOT_FOUND", "Section not found");
  return section.campusId;
}

async function assertParentsUsable(classId: string, campusId: string, academicYearId: string) {
  const [klass, campus, academicYear] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.campus.findUnique({ where: { id: campusId } }),
    prisma.academicYear.findUnique({ where: { id: academicYearId } }),
  ]);

  if (!klass || klass.archivedAt) throw new HttpError(400, "CLASS_NOT_FOUND", "Class not found or archived");
  if (!campus || campus.archivedAt) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");
  if (!academicYear) throw new HttpError(400, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");
  if (academicYear.status === "CLOSED") {
    throw new HttpError(409, "ACADEMIC_YEAR_CLOSED", "Cannot add sections to a closed academic year");
  }
}

export async function createSection(
  input: {
    classId: string;
    campusId: string;
    academicYearId: string;
    name: string;
    capacity?: number;
    classTeacherId?: string;
  },
  actorId: string
) {
  await assertParentsUsable(input.classId, input.campusId, input.academicYearId);

  if (input.classTeacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: input.classTeacherId } });
    if (!teacher || !teacher.isActive) {
      throw new HttpError(400, "CLASS_TEACHER_NOT_FOUND", "classTeacherId does not reference an active user");
    }
  }

  const existing = await prisma.section.findUnique({
    where: {
      classId_campusId_academicYearId_name: {
        classId: input.classId,
        campusId: input.campusId,
        academicYearId: input.academicYearId,
        name: input.name,
      },
    },
  });
  if (existing) {
    throw new HttpError(409, "SECTION_EXISTS", `Section "${input.name}" already exists for this class/campus/year`);
  }

  const section = await prisma.section.create({ data: input });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Section",
    recordId: section.id,
    newValue: { name: section.name, classId: section.classId, campusId: section.campusId },
  });

  return section;
}

export async function updateSection(
  id: string,
  input: Partial<{ name: string; capacity: number; classTeacherId: string | null }>,
  actorId: string
) {
  const section = await prisma.section.findUnique({ where: { id }, include: { academicYear: true } });
  if (!section) throw new HttpError(404, "SECTION_NOT_FOUND", "Section not found");
  if (section.archivedAt) throw new HttpError(409, "SECTION_ARCHIVED", "Cannot edit an archived section");
  if (section.academicYear.status === "CLOSED") {
    throw new HttpError(409, "ACADEMIC_YEAR_CLOSED", "Cannot edit a section in a closed academic year");
  }

  if (input.classTeacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: input.classTeacherId } });
    if (!teacher || !teacher.isActive) {
      throw new HttpError(400, "CLASS_TEACHER_NOT_FOUND", "classTeacherId does not reference an active user");
    }
  }

  const updated = await prisma.section.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Section",
    recordId: id,
    oldValue: { name: section.name, capacity: section.capacity, classTeacherId: section.classTeacherId },
    newValue: { name: updated.name, capacity: updated.capacity, classTeacherId: updated.classTeacherId },
  });

  return updated;
}

export async function archiveSection(id: string, actorId: string) {
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new HttpError(404, "SECTION_NOT_FOUND", "Section not found");
  if (section.archivedAt) throw new HttpError(409, "SECTION_ALREADY_ARCHIVED", "Section is already archived");

  const updated = await prisma.section.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "Section", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
