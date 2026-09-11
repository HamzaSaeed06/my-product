import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createNotification } from "../notifications/service.js";

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

export async function listComplaints(filter: { studentId?: string; status?: string; assignedToId?: string }) {
  return prisma.complaint.findMany({
    where: { studentId: filter.studentId, assignedToId: filter.assignedToId, status: filter.status as never },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function getComplaint(id: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id }, include: include() });
  if (!complaint) throw new HttpError(404, "COMPLAINT_NOT_FOUND", "Complaint not found");
  return complaint;
}

export async function createComplaint(
  input: { studentId?: string; category: string; description: string },
  actorId: string
) {
  if (input.studentId) {
    const student = await prisma.student.findUnique({ where: { id: input.studentId } });
    if (!student || student.status === "ARCHIVED") throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  }

  const complaint = await prisma.complaint.create({
    data: { ...input, submittedById: actorId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Complaint", recordId: complaint.id, newValue: input });

  return complaint;
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
