import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// A section can't sit two papers at overlapping times on the same date —
// checked across ALL exams for that section/date, not just the current
// exam, since real exam timetables don't overlap across series either.
async function assertNoScheduleConflict(sectionId: string, date: Date, startTime: string, endTime: string, excludeId?: string) {
  const sameDay = await prisma.examSchedule.findMany({
    where: { sectionId, date, id: excludeId ? { not: excludeId } : undefined },
  });

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);
  const conflict = sameDay.find((s) => timeToMinutes(s.startTime) < newEnd && newStart < timeToMinutes(s.endTime));
  if (conflict) {
    throw new HttpError(409, "SCHEDULE_CONFLICT", "This section already has a paper scheduled at an overlapping time on this date");
  }
}

export async function listExamSchedules(filter: { examId?: string; sectionId?: string }) {
  return prisma.examSchedule.findMany({
    where: filter,
    include: { subject: true, klass: true, section: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function createExamSchedule(
  input: { examId: string; subjectId: string; classId: string; sectionId: string; date: Date; startTime: string; endTime: string; room?: string },
  actorId: string
) {
  const [exam, subject, section] = await Promise.all([
    prisma.exam.findUnique({ where: { id: input.examId } }),
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.section.findUnique({ where: { id: input.sectionId } }),
  ]);
  if (!exam) throw new HttpError(400, "EXAM_NOT_FOUND", "Exam not found");
  if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (section.classId !== input.classId) throw new HttpError(400, "SECTION_CLASS_MISMATCH", "This section does not belong to the given class");
  if (section.academicYearId !== exam.academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "This section does not belong to the exam's academic year");
  }

  await assertNoScheduleConflict(input.sectionId, input.date, input.startTime, input.endTime);

  try {
    const schedule = await prisma.examSchedule.create({
      data: input,
      include: { subject: true, klass: true, section: true },
    });

    await writeAuditLog({ actorId, action: "CREATE", resource: "ExamSchedule", recordId: schedule.id, newValue: input });

    return schedule;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "SCHEDULE_EXISTS", "This subject is already scheduled for this section in this exam");
    }
    throw err;
  }
}

export async function updateExamSchedule(
  id: string,
  input: { date?: Date; startTime?: string; endTime?: string; room?: string },
  actorId: string
) {
  const existing = await prisma.examSchedule.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "SCHEDULE_NOT_FOUND", "Exam schedule not found");

  await assertNoScheduleConflict(
    existing.sectionId,
    input.date ?? existing.date,
    input.startTime ?? existing.startTime,
    input.endTime ?? existing.endTime,
    id
  );

  const updated = await prisma.examSchedule.update({
    where: { id },
    data: input,
    include: { subject: true, klass: true, section: true },
  });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "ExamSchedule", recordId: id, oldValue: existing, newValue: input });

  return updated;
}
