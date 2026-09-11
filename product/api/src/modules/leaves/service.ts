import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createNotification } from "../notifications/service.js";

function include() {
  return {
    student: { select: { id: true, fullName: true, studentCode: true } },
    teacher: { include: { user: { select: { fullName: true } } } },
    requestedBy: { select: { id: true, fullName: true } },
    decidedBy: { select: { id: true, fullName: true } },
  } as const;
}

export async function listLeaves(filter: { studentId?: string; teacherId?: string; status?: string }) {
  return prisma.leave.findMany({
    where: { studentId: filter.studentId, teacherId: filter.teacherId, status: filter.status as never },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function createLeave(
  input: {
    subjectType: "STUDENT" | "TEACHER";
    studentId?: string;
    teacherId?: string;
    fromDate: Date;
    toDate: Date;
    reason: string;
  },
  actorId: string
) {
  if (input.subjectType === "STUDENT") {
    if (!input.studentId || input.teacherId) throw new HttpError(400, "SUBJECT_MISMATCH", "subjectType STUDENT requires studentId only");
    const student = await prisma.student.findUnique({ where: { id: input.studentId } });
    if (!student || student.status === "ARCHIVED") throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  } else {
    if (!input.teacherId || input.studentId) throw new HttpError(400, "SUBJECT_MISMATCH", "subjectType TEACHER requires teacherId only");
    const teacher = await prisma.teacher.findUnique({ where: { id: input.teacherId } });
    if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");
  }

  if (input.toDate < input.fromDate) throw new HttpError(400, "INVALID_DATE_RANGE", "toDate cannot be before fromDate");

  const isRetrospective = input.fromDate < new Date(new Date().toDateString());

  const leave = await prisma.leave.create({
    data: { ...input, isRetrospective, requestedById: actorId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Leave", recordId: leave.id, newValue: input });

  return leave;
}

export async function decideLeave(
  id: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) throw new HttpError(404, "LEAVE_NOT_FOUND", "Leave request not found");
  if (leave.status !== "PENDING") throw new HttpError(409, "ALREADY_DECIDED", `Leave already ${leave.status.toLowerCase()}`);

  const updated = await prisma.leave.update({
    where: { id },
    data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: decision,
    resource: "Leave",
    recordId: id,
    reason: decisionNote,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  await createNotification({
    userId: leave.requestedById,
    title: `Leave request ${decision.toLowerCase()}`,
    body: `Your leave request for ${leave.fromDate.toDateString()} - ${leave.toDate.toDateString()} was ${decision.toLowerCase()}.`,
  });

  return updated;
}

export async function cancelLeave(id: string, actorId: string) {
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) throw new HttpError(404, "LEAVE_NOT_FOUND", "Leave request not found");
  if (leave.status === "CANCELLED" || leave.status === "REJECTED") {
    throw new HttpError(409, "CANNOT_CANCEL", `Cannot cancel a leave request that is already ${leave.status.toLowerCase()}`);
  }

  const updated = await prisma.leave.update({ where: { id }, data: { status: "CANCELLED" }, include: include() });

  await writeAuditLog({ actorId, action: "CANCEL", resource: "Leave", recordId: id, newValue: { status: "CANCELLED" } });

  return updated;
}

// Consumed by Phase 3's attendance/service.ts to auto-mark ABSENT as LEAVE
// when an approved leave covers the date — completes the deferral logged
// in schema.prisma's Phase 3 header comment.
export async function hasApprovedLeave(studentId: string, date: Date): Promise<boolean> {
  const leave = await prisma.leave.findFirst({
    where: { studentId, status: "APPROVED", fromDate: { lte: date }, toDate: { gte: date } },
  });
  return !!leave;
}
