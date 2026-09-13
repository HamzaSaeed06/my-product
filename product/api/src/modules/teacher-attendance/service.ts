import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function markTeacherAttendance(
  input: { teacherId: string; date: string; status: AttendanceStatus },
  actorId: string
) {
  const teacher = await prisma.teacher.findUnique({ where: { id: input.teacherId } });
  if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");

  const date = new Date(input.date);
  const existing = await prisma.teacherAttendance.findUnique({
    where: { teacherId_date: { teacherId: input.teacherId, date } },
  });
  if (existing) throw new HttpError(409, "ALREADY_MARKED", "Attendance already marked for this teacher on this date");

  const record = await prisma.teacherAttendance.create({
    data: { teacherId: input.teacherId, date, status: input.status, markedById: actorId },
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "TeacherAttendance",
    recordId: record.id,
    newValue: { teacherId: input.teacherId, date: input.date, status: input.status },
  });

  return record;
}

export async function listTeacherAttendance(filter: { teacherId?: string; date?: string; campusIdIn?: string[] }) {
  return prisma.teacherAttendance.findMany({
    where: {
      teacherId: filter.teacherId,
      date: filter.date ? new Date(filter.date) : undefined,
      // A Teacher's campus is their own TEACHER UserRole's campusId, not a
      // joined class/section — see
      // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 3.
      teacher: filter.campusIdIn
        ? { user: { userRoles: { some: { role: { name: "TEACHER" }, campusId: { in: filter.campusIdIn } } } } }
        : undefined,
    },
    include: { teacher: { include: { user: { select: { fullName: true } } } } },
    orderBy: { date: "desc" },
  });
}

// Direct permission-gated correction (not a full approval workflow) — spec
// only diagrams an approval workflow for STUDENT attendance corrections;
// teacher_attendance.correct is treated as an admin-level direct edit.
export async function correctTeacherAttendance(id: string, status: AttendanceStatus, actorId: string) {
  const record = await prisma.teacherAttendance.findUnique({ where: { id } });
  if (!record) throw new HttpError(404, "TEACHER_ATTENDANCE_NOT_FOUND", "Teacher attendance record not found");

  const updated = await prisma.teacherAttendance.update({ where: { id }, data: { status } });

  await writeAuditLog({
    actorId,
    action: "CORRECT",
    resource: "TeacherAttendance",
    recordId: id,
    oldValue: { status: record.status },
    newValue: { status },
  });

  return updated;
}
