import type { DayOfWeek } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createNotification } from "../notifications/service.js";

const DAY_OF_WEEK_BY_INDEX: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function dayOfWeekFor(date: Date): DayOfWeek {
  return DAY_OF_WEEK_BY_INDEX[date.getUTCDay()]!;
}

// A teacher is "free" at a given date/day/period if they have no other
// TimetableEntry there AND no other active (non-cancelled) Substitution
// covering that same slot — free-period teachers are the ones who pass
// this check (spec: "Free period teachers shown first").
async function assertTeacherFreeAt(teacherId: string, date: Date, dayOfWeek: DayOfWeek, periodNumber: number, academicYearId: string) {
  const busyEntry = await prisma.timetableEntry.findFirst({
    where: { teacherId, dayOfWeek, periodNumber, timetable: { academicYearId } },
  });
  if (busyEntry) throw new HttpError(409, "SUBSTITUTE_NOT_FREE", "This teacher already has a class at that day/period");

  const busySubstitution = await prisma.substitution.findFirst({
    where: {
      substituteTeacherId: teacherId,
      date,
      cancelledAt: null,
      timetableEntry: { periodNumber },
    },
  });
  if (busySubstitution) throw new HttpError(409, "SUBSTITUTE_NOT_FREE", "This teacher is already substituting another class at that time");
}

export async function createSubstitution(
  input: { timetableEntryId: string; date: string; substituteTeacherId: string; reason?: string },
  actorId: string
) {
  const entry = await prisma.timetableEntry.findUnique({
    where: { id: input.timetableEntryId },
    include: { timetable: true },
  });
  if (!entry) throw new HttpError(404, "TIMETABLE_ENTRY_NOT_FOUND", "Timetable entry not found");

  const date = new Date(input.date);
  const dayOfWeek = dayOfWeekFor(date);
  if (dayOfWeek !== entry.dayOfWeek) {
    throw new HttpError(400, "DATE_DAY_MISMATCH", `That date falls on ${dayOfWeek}, but this period is scheduled for ${entry.dayOfWeek}`);
  }

  if (input.substituteTeacherId === entry.teacherId) {
    throw new HttpError(400, "SAME_TEACHER", "Substitute cannot be the same as the original teacher");
  }

  const originalAbsence = await prisma.teacherAttendance.findUnique({
    where: { teacherId_date: { teacherId: entry.teacherId, date } },
  });
  if (!originalAbsence || originalAbsence.status !== "ABSENT") {
    throw new HttpError(400, "TEACHER_NOT_MARKED_ABSENT", "The original teacher must be marked absent for this date first");
  }

  const substituteTeacher = await prisma.teacher.findUnique({ where: { id: input.substituteTeacherId } });
  if (!substituteTeacher || substituteTeacher.status === "ARCHIVED") {
    throw new HttpError(400, "TEACHER_NOT_FOUND", "Substitute teacher not found or archived");
  }

  await assertTeacherFreeAt(input.substituteTeacherId, date, dayOfWeek, entry.periodNumber, entry.timetable.academicYearId);

  const existing = await prisma.substitution.findUnique({
    where: { timetableEntryId_date: { timetableEntryId: input.timetableEntryId, date } },
  });
  if (existing && !existing.cancelledAt) {
    throw new HttpError(409, "SUBSTITUTION_EXISTS", "This period already has an active substitution for this date");
  }

  const substitution = await prisma.substitution.create({
    data: {
      timetableEntryId: input.timetableEntryId,
      date,
      originalTeacherId: entry.teacherId,
      substituteTeacherId: input.substituteTeacherId,
      reason: input.reason,
      createdById: actorId,
    },
    include: { timetableEntry: { include: { subject: true } }, substituteTeacher: { include: { user: true } } },
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Substitution",
    recordId: substitution.id,
    newValue: { timetableEntryId: input.timetableEntryId, date: input.date, substituteTeacherId: input.substituteTeacherId },
  });

  await createNotification({
    userId: substituteTeacher.userId,
    title: "Substitution assigned",
    body: `You are covering ${substitution.timetableEntry.subject.name} on ${input.date}, period ${entry.periodNumber}.`,
  });

  return substitution;
}

export async function listSubstitutions(filter: { date?: string; teacherId?: string }) {
  return prisma.substitution.findMany({
    where: {
      date: filter.date ? new Date(filter.date) : undefined,
      OR: filter.teacherId ? [{ originalTeacherId: filter.teacherId }, { substituteTeacherId: filter.teacherId }] : undefined,
    },
    include: {
      timetableEntry: { include: { subject: true } },
      originalTeacher: { include: { user: { select: { fullName: true } } } },
      substituteTeacher: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { date: "desc" },
  });
}

export async function cancelSubstitution(id: string, actorId: string) {
  const substitution = await prisma.substitution.findUnique({ where: { id } });
  if (!substitution) throw new HttpError(404, "SUBSTITUTION_NOT_FOUND", "Substitution not found");
  if (substitution.cancelledAt) throw new HttpError(409, "ALREADY_CANCELLED", "Substitution already cancelled");

  const updated = await prisma.substitution.update({ where: { id }, data: { cancelledAt: new Date() } });

  await writeAuditLog({
    actorId,
    action: "CANCEL",
    resource: "Substitution",
    recordId: id,
    newValue: { cancelledAt: updated.cancelledAt },
  });

  return updated;
}
