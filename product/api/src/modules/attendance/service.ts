import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createApprovalRequest } from "../approvals/service.js";
import { hasApprovedLeave } from "../leaves/service.js";

// Spec: "Teacher can only mark attendance for assigned classes." Only
// enforced when the actor actually has a Teacher profile — Office/
// Principal/Super Admin marking on someone's behalf have no "assigned
// classes" concept and are already gated by the attendance.mark
// permission itself.
async function assertTeacherAssignedToSection(actorId: string, sectionId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: actorId } });
  if (!teacher) return;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId: teacher.id, sectionId, archivedAt: null },
  });
  if (!assignment) {
    throw new HttpError(403, "NOT_ASSIGNED_TO_SECTION", "You are not assigned to teach this section");
  }
}

export async function markAttendance(
  input: { sectionId: string; date: string; entries: { studentId: string; status: AttendanceStatus }[] },
  actorId: string
) {
  const section = await prisma.section.findUnique({ where: { id: input.sectionId } });
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");

  await assertTeacherAssignedToSection(actorId, input.sectionId);

  const date = new Date(input.date);
  const studentIds = input.entries.map((e) => e.studentId);

  const existing = await prisma.attendance.findMany({ where: { studentId: { in: studentIds }, date } });
  if (existing.length > 0) {
    throw new HttpError(
      409,
      "ATTENDANCE_ALREADY_MARKED",
      `Attendance already marked for ${existing.length} student(s) on this date — use a correction request to change it`
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: { in: studentIds }, sectionId: input.sectionId, status: "ACTIVE" },
  });
  if (enrollments.length !== studentIds.length) {
    throw new HttpError(400, "STUDENT_NOT_ENROLLED", "One or more students are not actively enrolled in this section");
  }

  // Spec's Attendance workflow #2: a student with an approved leave
  // covering this date is auto-marked LEAVE, never ABSENT, regardless of
  // what the teacher submitted — completes the deferral logged in
  // schema.prisma's Phase 3 header comment (Leave didn't exist until
  // Phase 6). Only ABSENT is overridden; an explicit PRESENT still counts
  // (e.g. the student showed up despite the approved leave).
  const resolvedEntries = await Promise.all(
    input.entries.map(async (e) => {
      if (e.status !== "ABSENT") return e;
      const onLeave = await hasApprovedLeave(e.studentId, date);
      return onLeave ? { ...e, status: "LEAVE" as const } : e;
    })
  );

  const created = await prisma.$transaction(
    resolvedEntries.map((e) =>
      prisma.attendance.create({
        data: { studentId: e.studentId, sectionId: input.sectionId, date, status: e.status, markedById: actorId },
      })
    )
  );

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Attendance",
    newValue: { sectionId: input.sectionId, date: input.date, entries: resolvedEntries },
  });

  return created;
}

export async function listAttendance(filter: { sectionId?: string; studentId?: string; date?: string }) {
  return prisma.attendance.findMany({
    where: {
      sectionId: filter.sectionId,
      studentId: filter.studentId,
      date: filter.date ? new Date(filter.date) : undefined,
    },
    include: { student: { select: { id: true, fullName: true, studentCode: true } } },
    orderBy: [{ date: "desc" }],
  });
}

export async function requestAttendanceCorrection(
  attendanceId: string,
  input: { newStatus: AttendanceStatus; reason: string },
  actorId: string
) {
  const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId } });
  if (!attendance) throw new HttpError(404, "ATTENDANCE_NOT_FOUND", "Attendance record not found");
  if (attendance.status === input.newStatus) {
    throw new HttpError(400, "NO_CHANGE", "Requested status is the same as the current status");
  }

  return createApprovalRequest({
    type: "ATTENDANCE_CORRECTION",
    resource: "Attendance",
    recordId: attendanceId,
    requestedById: actorId,
    approverRole: "INCHARGE",
    payload: { attendanceId, oldStatus: attendance.status, newStatus: input.newStatus, reason: input.reason },
  });
}

// Applies the effect directly here (not in the generic approvals module) to
// avoid a circular dependency — see schema.prisma's Phase 3 header comment.
export async function decideAttendanceCorrection(
  approvalRequestId: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
  if (!request || request.type !== "ATTENDANCE_CORRECTION") {
    throw new HttpError(404, "CORRECTION_NOT_FOUND", "Attendance correction request not found");
  }
  if (request.status !== "PENDING") {
    throw new HttpError(409, "APPROVAL_ALREADY_DECIDED", `Request already ${request.status.toLowerCase()}`);
  }

  const payload = request.payload as { attendanceId: string; oldStatus: AttendanceStatus; newStatus: AttendanceStatus; reason: string };

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const req = await tx.approvalRequest.update({
      where: { id: approvalRequestId },
      data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
    });
    if (decision === "APPROVED") {
      await tx.attendance.update({ where: { id: payload.attendanceId }, data: { status: payload.newStatus } });
    }
    return req;
  });

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "Attendance",
    recordId: payload.attendanceId,
    oldValue: { status: payload.oldStatus },
    newValue: decision === "APPROVED" ? { status: payload.newStatus } : undefined,
    reason: payload.reason,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updatedRequest;
}
