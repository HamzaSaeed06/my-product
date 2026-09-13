import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createNotification } from "../notifications/service.js";
import { findInchargeUserIdsForSection } from "../incharge-scopes/service.js";

function include() {
  return {
    student: { select: { id: true, fullName: true, studentCode: true } },
    teacher: { include: { user: { select: { fullName: true } } } },
    requestedBy: { select: { id: true, fullName: true } },
    assignedTo: { select: { id: true, fullName: true } },
    decidedBy: { select: { id: true, fullName: true } },
  } as const;
}

// Thin getter for controllers that need to scope-check a leave by id
// before deciding/cancelling it — Leave has no direct campusId, so this
// derives it per subjectType (STUDENT via active enrollment, TEACHER via
// their own TEACHER UserRole.campusId). Returns null when undeterminable
// (e.g. a student with no active enrollment yet) — callers treat that as
// "can't verify, so a campus-assigned actor is refused" rather than
// silently letting it through.
export async function getLeaveCampusId(id: string): Promise<string | null> {
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) throw new HttpError(404, "LEAVE_NOT_FOUND", "Leave request not found");

  if (leave.subjectType === "STUDENT" && leave.studentId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: leave.studentId, status: "ACTIVE" },
      include: { section: true },
    });
    return enrollment?.section.campusId ?? null;
  }

  if (leave.subjectType === "TEACHER" && leave.teacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: leave.teacherId },
      include: { user: { include: { userRoles: { where: { role: { name: "TEACHER" } } } } } },
    });
    return teacher?.user.userRoles[0]?.campusId ?? null;
  }

  return null;
}

export async function listLeaves(filter: {
  studentId?: string;
  studentIdIn?: string[];
  teacherId?: string;
  status?: string;
  // Campus Head/Office's own campus(es) — a Leave list mixes STUDENT- and
  // TEACHER-subject rows, so this can't be a plain AND'd condition (a
  // student-subject row has no related teacher and would incorrectly fail
  // a naive `teacher: {...}` filter). Combined via OR below, scoping
  // STUDENT rows by the requester's own enrollment-campus and TEACHER rows
  // by the teacher's campus-assigned role. See
  // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 5.
  campusIdIn?: string[];
  assignedToId?: string;
}) {
  const studentIdFilter = filter.studentIdIn ? { in: filter.studentIdIn } : filter.studentId;

  return prisma.leave.findMany({
    where: {
      teacherId: filter.teacherId,
      status: filter.status as never,
      assignedToId: filter.assignedToId,
      ...(filter.campusIdIn
        ? {
            OR: [
              { subjectType: "STUDENT", student: { enrollments: { some: { status: "ACTIVE", section: { campusId: { in: filter.campusIdIn } } } } } },
              { subjectType: "TEACHER", teacher: { user: { userRoles: { some: { role: { name: "TEACHER" }, campusId: { in: filter.campusIdIn } } } } } },
            ],
          }
        : { studentId: studentIdFilter }),
    },
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

  // Phase 11 Phase B auto-routing: a STUDENT-subject leave resolves the
  // student's current Enrollment → Section → Incharge(s) and auto-assigns
  // to the first match, notifying all matches (overlapping Incharge scopes
  // are allowed by design, so more than one can legitimately cover a
  // section). Uses the student's currently-active enrollment — same
  // convention every other scope check in this codebase already uses, not
  // a point-in-time lookup as of fromDate (a leave spanning a section
  // change is a rare enough edge case that this is an acceptable
  // simplification, not silently wrong: it just routes by "where they are
  // now" rather than "where they were"). No match (no active enrollment
  // yet, or a TEACHER-subject leave) leaves assignedToId null — falls back
  // to Office/Campus Head deciding directly, exactly as it already worked
  // before this feature existed.
  let assignedToId: string | undefined;
  let inchargeUserIds: string[] = [];
  if (input.subjectType === "STUDENT" && input.studentId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: input.studentId, status: "ACTIVE" },
    });
    if (enrollment) {
      inchargeUserIds = await findInchargeUserIdsForSection(enrollment.sectionId);
      assignedToId = inchargeUserIds[0];
    }
  }

  const leave = await prisma.leave.create({
    data: { ...input, isRetrospective, requestedById: actorId, assignedToId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Leave", recordId: leave.id, newValue: { ...input, assignedToId } });

  await Promise.all(
    inchargeUserIds.map((userId) =>
      createNotification({
        userId,
        title: "New leave request",
        body: `A leave request (${input.fromDate.toDateString()} – ${input.toDate.toDateString()}) needs your review.`,
      })
    )
  );

  return leave;
}

// Incharge forwards a leave they're currently assigned to on to that
// section's Class Teacher (Section.classTeacherId) — a deliberate,
// explicit action per Phase 11 Phase B, not a silent reassignment.
// Deciding remains gated by the existing permission+scope checks
// regardless of who assignedToId points to; this only changes who the UI
// surfaces it to as "yours to act on."
export async function forwardLeave(id: string, actorId: string) {
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) throw new HttpError(404, "LEAVE_NOT_FOUND", "Leave request not found");
  if (leave.status !== "PENDING") throw new HttpError(409, "ALREADY_DECIDED", `Leave already ${leave.status.toLowerCase()}`);
  if (leave.subjectType !== "STUDENT" || !leave.studentId) {
    throw new HttpError(400, "NOT_FORWARDABLE", "Only a student-subject leave can be forwarded to a Class Teacher");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: leave.studentId, status: "ACTIVE" },
    include: { section: true },
  });
  if (!enrollment?.section.classTeacherId) {
    throw new HttpError(400, "NO_CLASS_TEACHER", "This section has no Class Teacher assigned to forward to");
  }

  const updated = await prisma.leave.update({
    where: { id },
    data: { assignedToId: enrollment.section.classTeacherId },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: "FORWARD",
    resource: "Leave",
    recordId: id,
    oldValue: { assignedToId: leave.assignedToId },
    newValue: { assignedToId: enrollment.section.classTeacherId },
  });

  await createNotification({
    userId: enrollment.section.classTeacherId,
    title: "Leave request forwarded to you",
    body: `A leave request (${leave.fromDate.toDateString()} – ${leave.toDate.toDateString()}) was forwarded to you for review.`,
  });

  return updated;
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
