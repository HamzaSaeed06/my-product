import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listAdmissions(filter: {
  studentId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  // Campus Head/Office's own campus(es) — Admission has a direct campusId
  // column, so this is a plain filter, not a join. See
  // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 1.
  campusIdIn?: string[];
}) {
  return prisma.admission.findMany({
    where: { studentId: filter.studentId, status: filter.status, campusId: filter.campusIdIn ? { in: filter.campusIdIn } : undefined },
    include: { student: true, campus: true, klass: true, academicYear: true },
    orderBy: { appliedAt: "desc" },
  });
}

// Thin getter for controllers that need to scope-check an admission by id
// before deciding/withdrawing it (assertCampusInScope needs the record's
// campusId first) — not exposed as its own route.
export async function getAdmissionCampusId(id: string): Promise<string> {
  const admission = await prisma.admission.findUnique({ where: { id }, select: { campusId: true } });
  if (!admission) throw new HttpError(404, "ADMISSION_NOT_FOUND", "Admission not found");
  return admission.campusId;
}

// Admission ≠ Enrollment (spec) — this only records the application.
// Enrollment is a deliberate separate step after approval.
export async function createAdmission(
  input: { studentId: string; campusId: string; classId: string; academicYearId: string },
  actorId: string
) {
  const [student, campus, klass, academicYear] = await Promise.all([
    prisma.student.findUnique({ where: { id: input.studentId } }),
    prisma.campus.findUnique({ where: { id: input.campusId } }),
    prisma.class.findUnique({ where: { id: input.classId } }),
    prisma.academicYear.findUnique({ where: { id: input.academicYearId } }),
  ]);

  if (!student || student.status === "ARCHIVED") {
    throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  }
  if (!campus || campus.archivedAt) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");
  if (!klass || klass.archivedAt) throw new HttpError(400, "CLASS_NOT_FOUND", "Class not found or archived");
  if (!academicYear) throw new HttpError(400, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");
  if (academicYear.status === "CLOSED") {
    throw new HttpError(409, "ACADEMIC_YEAR_CLOSED", "Cannot apply for admission in a closed academic year");
  }

  // Duplicate-submission guard (Section 1.3 — verified this was missing,
  // unlike online-payment/service.ts's webhook idempotency check). No
  // schema-level unique constraint: a student legitimately CAN reapply for
  // the same class/year after a REJECTED decision, so a hard constraint on
  // (studentId, classId, academicYearId) would wrongly block that. This
  // only blocks a second PENDING admission for the same triple — the
  // actual double-click/duplicate-request case — inside a transaction so
  // the check and the insert are atomic relative to each other.
  const admission = await prisma.$transaction(async (tx) => {
    const existingPending = await tx.admission.findFirst({
      where: {
        studentId: input.studentId,
        classId: input.classId,
        academicYearId: input.academicYearId,
        status: "PENDING",
      },
    });
    if (existingPending) {
      throw new HttpError(409, "ADMISSION_ALREADY_PENDING", "A pending admission already exists for this student, class, and academic year");
    }
    return tx.admission.create({ data: input });
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Admission",
    recordId: admission.id,
    newValue: { studentId: input.studentId, classId: input.classId, campusId: input.campusId },
  });

  return admission;
}

export async function decideAdmission(
  id: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) throw new HttpError(404, "ADMISSION_NOT_FOUND", "Admission not found");
  if (admission.status !== "PENDING") {
    throw new HttpError(409, "ADMISSION_ALREADY_DECIDED", `Admission already ${admission.status.toLowerCase()}`);
  }

  const updated = await prisma.admission.update({
    where: { id },
    data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
  });

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "Admission",
    recordId: id,
    oldValue: { status: "PENDING" },
    newValue: { status: decision, decisionNote },
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updated;
}

export async function withdrawAdmission(id: string, actorId: string) {
  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) throw new HttpError(404, "ADMISSION_NOT_FOUND", "Admission not found");
  if (admission.status !== "PENDING") {
    throw new HttpError(409, "ADMISSION_ALREADY_DECIDED", `Admission already ${admission.status.toLowerCase()}`);
  }

  const updated = await prisma.admission.update({ where: { id }, data: { status: "WITHDRAWN" } });

  await writeAuditLog({
    actorId,
    action: "WITHDRAW",
    resource: "Admission",
    recordId: id,
    oldValue: { status: "PENDING" },
    newValue: { status: "WITHDRAWN" },
  });

  return updated;
}
