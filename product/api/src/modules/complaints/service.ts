import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createNotification } from "../notifications/service.js";
import { findInchargeUserIdsForSection } from "../incharge-scopes/service.js";

function include() {
  return {
    student: { select: { id: true, fullName: true, studentCode: true } },
    submittedBy: { select: { id: true, fullName: true } },
    assignedTo: { select: { id: true, fullName: true } },
    notes: { include: { author: { select: { id: true, fullName: true } } }, orderBy: { createdAt: "asc" as const } },
  } as const;
}

function assertStatus(current: string, expected: string | string[]) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(current)) {
    throw new HttpError(409, "INVALID_STATE_TRANSITION", `Complaint must be ${allowed.join(" or ")} for this action — it is currently ${current}`);
  }
}

export async function listComplaints(filter: {
  studentId?: string;
  studentIdIn?: string[];
  status?: string;
  assignedToId?: string;
  // Campus Head/Office's own campus(es) — Complaint has a direct campusId
  // column (unlike Invoice/Payment/etc., which derive it via enrollment),
  // so this is a plain filter. See
  // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 5.
  campusIdIn?: string[];
}) {
  return prisma.complaint.findMany({
    where: {
      studentId: filter.studentIdIn ? { in: filter.studentIdIn } : filter.studentId,
      assignedToId: filter.assignedToId,
      status: filter.status as never,
      campusId: filter.campusIdIn ? { in: filter.campusIdIn } : undefined,
    },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function getComplaint(id: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id }, include: include() });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  return complaint;
}

// Thin getter for controllers that need to scope-check a complaint by id
// before assigning/progressing/resolving/closing/reopening it.
export async function getComplaintCampusId(id: string): Promise<string> {
  const complaint = await prisma.complaint.findUnique({ where: { id }, select: { campusId: true } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  return complaint.campusId;
}

// Resolves the campus (and, for auto-routing, the section) a complaint
// belongs to: a student-linked complaint always derives it from that
// student's active enrollment (never trusts a client-supplied campusId for
// this case — the student's real campus is authoritative); a complaint
// with no student requires an explicit campusId, since there's nothing
// else to derive it from. See docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md "Gap 2".
async function resolveComplaintCampusAndSection(
  studentId: string | undefined,
  explicitCampusId: string | undefined
): Promise<{ campusId: string; sectionId: string | null }> {
  if (studentId) {
    const activeEnrollment = await prisma.enrollment.findFirst({
      where: { studentId, status: "ACTIVE" },
      include: { section: true },
    });
    if (activeEnrollment) return { campusId: activeEnrollment.section.campusId, sectionId: activeEnrollment.sectionId };
    // A student with no active enrollment yet (mid-admission) has no
    // derivable campus from enrollment — fall back to the explicit value,
    // same rule PHASE_11A's plan gives for the analogous "students" list.
  }
  if (explicitCampusId) return { campusId: explicitCampusId, sectionId: null };
  throw new HttpError(400, "CAMPUS_REQUIRED", "campusId is required when the complaint has no student with an active enrollment");
}

export async function createComplaint(
  input: { studentId?: string; campusId?: string; category: string; description: string },
  actorId: string
) {
  if (input.studentId) {
    const student = await prisma.student.findUnique({ where: { id: input.studentId } });
    if (!student || student.status === "ARCHIVED") throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  }

  const { campusId, sectionId } = await resolveComplaintCampusAndSection(input.studentId, input.campusId);

  // Phase 11 Phase B auto-routing: a student-linked complaint (with a
  // resolvable section) auto-assigns to its Incharge, landing directly in
  // ASSIGNED rather than sitting OPEN and unowned. A campus-less or
  // no-active-enrollment complaint stays OPEN, exactly as before — nothing
  // to route it to yet.
  const inchargeUserIds = sectionId ? await findInchargeUserIdsForSection(sectionId) : [];
  const assignedToId = inchargeUserIds[0];

  const complaint = await prisma.complaint.create({
    data: {
      studentId: input.studentId,
      category: input.category,
      description: input.description,
      campusId,
      submittedById: actorId,
      assignedToId,
      status: assignedToId ? "ASSIGNED" : "OPEN",
    },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Complaint", recordId: complaint.id, newValue: { ...input, campusId, assignedToId } });

  await Promise.all(
    inchargeUserIds.map((userId) =>
      createNotification({
        userId,
        title: "New complaint assigned",
        body: `A ${input.category} complaint needs your review.`,
      })
    )
  );

  return complaint;
}

// Incharge forwards a complaint they're currently assigned to on to the
// student's section Class Teacher (Section.classTeacherId) — Phase 11
// Phase B, mirrors leaves/service.ts's forwardLeave. Deliberately doesn't
// change status (stays ASSIGNED, just to a different person) — forwarding
// isn't a state transition, just a reassignment, same as the existing
// assign action.
export async function forwardComplaint(id: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  if (!complaint.studentId) {
    throw new HttpError(400, "NOT_FORWARDABLE", "Only a student-linked complaint can be forwarded to a Class Teacher");
  }
  assertStatus(complaint.status, ["ASSIGNED", "IN_PROGRESS"]);

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: complaint.studentId, status: "ACTIVE" },
    include: { section: true },
  });
  if (!enrollment?.section.classTeacherId) {
    throw new HttpError(400, "NO_CLASS_TEACHER", "This section has no Class Teacher assigned to forward to");
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { assignedToId: enrollment.section.classTeacherId },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: "FORWARD",
    resource: "Complaint",
    recordId: id,
    oldValue: { assignedToId: complaint.assignedToId },
    newValue: { assignedToId: enrollment.section.classTeacherId },
  });

  await createNotification({
    userId: enrollment.section.classTeacherId,
    title: "Complaint forwarded to you",
    body: `A ${complaint.category} complaint was forwarded to you for review.`,
  });

  return updated;
}

// OPEN or REOPENED -> ASSIGNED — the same action restarts a reopened
// complaint's lifecycle for fresh investigation, per spec's explicit rule.
export async function assignComplaint(id: string, assignedToId: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  assertStatus(complaint.status, ["OPEN", "REOPENED"]);

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: "ASSIGNED", assignedToId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "ASSIGN", resource: "Complaint", recordId: id, newValue: { assignedToId } });

  await createNotification({
    userId: assignedToId,
    title: "Complaint assigned to you",
    body: `"${complaint.category}" — ${complaint.description.slice(0, 100)}`,
  });

  return updated;
}

export async function startComplaintProgress(id: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  assertStatus(complaint.status, "ASSIGNED");

  const updated = await prisma.complaint.update({ where: { id }, data: { status: "IN_PROGRESS" }, include: include() });

  await writeAuditLog({ actorId, action: "START_PROGRESS", resource: "Complaint", recordId: id, newValue: { status: "IN_PROGRESS" } });

  return updated;
}

export async function addComplaintNote(id: string, note: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  if (complaint.status === "CLOSED") throw new HttpError(409, "COMPLAINT_CLOSED", "Cannot add notes to a closed complaint");

  const created = await prisma.complaintNote.create({ data: { complaintId: id, authorId: actorId, note } });

  await writeAuditLog({ actorId, action: "ADD_NOTE", resource: "Complaint", recordId: id, newValue: { note } });

  return created;
}

export async function resolveComplaint(id: string, resolutionNote: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  assertStatus(complaint.status, "IN_PROGRESS");

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: "RESOLVED", resolutionNote, resolvedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "RESOLVE", resource: "Complaint", recordId: id, reason: resolutionNote });

  await createNotification({
    userId: complaint.submittedById,
    title: "Your complaint has been resolved",
    body: resolutionNote,
  });

  return updated;
}

// Cannot close without resolution (spec's explicit rule) — CLOSED is only
// reachable from RESOLVED, never any other status.
export async function closeComplaint(id: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  assertStatus(complaint.status, "RESOLVED");

  const updated = await prisma.complaint.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() }, include: include() });

  await writeAuditLog({ actorId, action: "CLOSE", resource: "Complaint", recordId: id, newValue: { status: "CLOSED" } });

  return updated;
}

export async function reopenComplaint(id: string, reason: string, actorId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  assertStatus(complaint.status, "CLOSED");

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: "REOPENED", resolvedAt: null, closedAt: null },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "REOPEN", resource: "Complaint", recordId: id, reason });

  if (complaint.assignedToId) {
    await createNotification({
      userId: complaint.assignedToId,
      title: "Complaint reopened",
      body: reason,
    });
  }

  return updated;
}
