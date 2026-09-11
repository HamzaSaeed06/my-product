import { Prisma } from "@prisma/client";
import type { DayOfWeek } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function include() {
  return {
    entries: {
      include: { subject: true, teacher: { include: { user: true } } },
      orderBy: [{ dayOfWeek: "asc" as const }, { periodNumber: "asc" as const }],
    },
  };
}

// Idempotent — a section only ever has one Timetable per academic year
// (spec: one timetable per section), created lazily on first access rather
// than requiring a separate "create timetable" step.
export async function getOrCreateTimetable(sectionId: string, academicYearId: string) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (section.academicYearId !== academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "This section does not belong to the given academic year");
  }

  const existing = await prisma.timetable.findUnique({
    where: { sectionId_academicYearId: { sectionId, academicYearId } },
    include: include(),
  });
  if (existing) return existing;

  return prisma.timetable.create({
    data: { sectionId, academicYearId },
    include: include(),
  });
}

export async function getTimetable(id: string) {
  const timetable = await prisma.timetable.findUnique({ where: { id }, include: include() });
  if (!timetable) throw new HttpError(404, "TIMETABLE_NOT_FOUND", "Timetable not found");
  return timetable;
}

// Same teacher cannot be in 2 places at the same day+period, across the
// WHOLE academic year (not just this section) — a service-layer check
// since it spans multiple Timetable rows, not something a DB constraint
// can express.
async function assertNoTeacherConflict(params: {
  teacherId: string;
  academicYearId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  excludeEntryId?: string;
}) {
  const conflict = await prisma.timetableEntry.findFirst({
    where: {
      teacherId: params.teacherId,
      dayOfWeek: params.dayOfWeek,
      periodNumber: params.periodNumber,
      id: params.excludeEntryId ? { not: params.excludeEntryId } : undefined,
      timetable: { academicYearId: params.academicYearId },
    },
    include: { timetable: { include: { section: true } } },
  });
  if (conflict) {
    throw new HttpError(
      409,
      "TEACHER_CONFLICT",
      `This teacher is already scheduled for ${params.dayOfWeek} period ${params.periodNumber} in section "${conflict.timetable.section.name}"`
    );
  }
}

export async function addTimetableEntry(
  timetableId: string,
  input: { dayOfWeek: DayOfWeek; periodNumber: number; subjectId: string; teacherId: string; startTime?: string; endTime?: string },
  actorId: string
) {
  const timetable = await prisma.timetable.findUnique({ where: { id: timetableId } });
  if (!timetable) throw new HttpError(404, "TIMETABLE_NOT_FOUND", "Timetable not found");

  const [subject, teacher] = await Promise.all([
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.teacher.findUnique({ where: { id: input.teacherId } }),
  ]);
  if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");

  await assertNoTeacherConflict({
    teacherId: input.teacherId,
    academicYearId: timetable.academicYearId,
    dayOfWeek: input.dayOfWeek,
    periodNumber: input.periodNumber,
  });

  try {
    const entry = await prisma.timetableEntry.create({
      data: { timetableId, ...input },
      include: { subject: true, teacher: { include: { user: true } } },
    });

    await writeAuditLog({
      actorId,
      action: "CREATE",
      resource: "TimetableEntry",
      recordId: entry.id,
      newValue: input,
    });

    return entry;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "SECTION_SLOT_CONFLICT", "This section already has a subject scheduled for that day/period");
    }
    throw err;
  }
}

export async function updateTimetableEntry(
  id: string,
  input: { dayOfWeek?: DayOfWeek; periodNumber?: number; subjectId?: string; teacherId?: string; startTime?: string; endTime?: string },
  actorId: string
) {
  const entry = await prisma.timetableEntry.findUnique({ where: { id }, include: { timetable: true } });
  if (!entry) throw new HttpError(404, "TIMETABLE_ENTRY_NOT_FOUND", "Timetable entry not found");

  const nextTeacherId = input.teacherId ?? entry.teacherId;
  const nextDayOfWeek = input.dayOfWeek ?? entry.dayOfWeek;
  const nextPeriodNumber = input.periodNumber ?? entry.periodNumber;

  if (input.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  }
  if (input.teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: input.teacherId } });
    if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");
  }

  await assertNoTeacherConflict({
    teacherId: nextTeacherId,
    academicYearId: entry.timetable.academicYearId,
    dayOfWeek: nextDayOfWeek,
    periodNumber: nextPeriodNumber,
    excludeEntryId: id,
  });

  try {
    const updated = await prisma.timetableEntry.update({
      where: { id },
      data: input,
      include: { subject: true, teacher: { include: { user: true } } },
    });

    await writeAuditLog({
      actorId,
      action: "UPDATE",
      resource: "TimetableEntry",
      recordId: id,
      oldValue: { dayOfWeek: entry.dayOfWeek, periodNumber: entry.periodNumber, subjectId: entry.subjectId, teacherId: entry.teacherId },
      newValue: input,
    });

    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "SECTION_SLOT_CONFLICT", "This section already has a subject scheduled for that day/period");
    }
    throw err;
  }
}

// Genuine hard-delete — an exception to the no-hard-delete policy. A
// TimetableEntry is scheduling configuration, not a financial/academic/
// identity record with its own history; the audit log permanently retains
// the old value, so traceability isn't lost, but the row itself doesn't
// need to persist as a phantom slot forever.
export async function removeTimetableEntry(id: string, actorId: string) {
  const entry = await prisma.timetableEntry.findUnique({ where: { id } });
  if (!entry) throw new HttpError(404, "TIMETABLE_ENTRY_NOT_FOUND", "Timetable entry not found");

  await prisma.timetableEntry.delete({ where: { id } });

  await writeAuditLog({
    actorId,
    action: "DELETE",
    resource: "TimetableEntry",
    recordId: id,
    oldValue: { dayOfWeek: entry.dayOfWeek, periodNumber: entry.periodNumber, subjectId: entry.subjectId, teacherId: entry.teacherId },
  });
}

export async function publishTimetable(id: string, actorId: string) {
  const timetable = await prisma.timetable.findUnique({ where: { id } });
  if (!timetable) throw new HttpError(404, "TIMETABLE_NOT_FOUND", "Timetable not found");
  if (timetable.status === "PUBLISHED") throw new HttpError(409, "ALREADY_PUBLISHED", "Timetable is already published");

  const updated = await prisma.timetable.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: "PUBLISH",
    resource: "Timetable",
    recordId: id,
    newValue: { status: "PUBLISHED" },
  });

  return updated;
}
