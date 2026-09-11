import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listEnrollments(filter: { studentId?: string; sectionId?: string; academicYearId?: string }) {
  return prisma.enrollment.findMany({
    where: filter,
    include: { student: true, klass: true, section: true, academicYear: true },
    orderBy: { enrolledAt: "desc" },
  });
}

async function assertSectionUsable(sectionId: string, classId: string, academicYearId: string) {
  const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { academicYear: true } });
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (section.classId !== classId) {
    throw new HttpError(400, "SECTION_CLASS_MISMATCH", "This section does not belong to the given class");
  }
  if (section.academicYearId !== academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "This section does not belong to the given academic year");
  }
  if (section.academicYear.status === "CLOSED") {
    throw new HttpError(409, "ACADEMIC_YEAR_CLOSED", "Cannot enroll into a closed academic year");
  }
  return section;
}

// Spec's "One Active Enrollment Per Academic Year" rule — enforced here,
// not as a DB constraint, because a student legitimately accumulates
// multiple Enrollment rows in the same year across transfers (see
// transferEnrollment). Only ONE may be ACTIVE at a time.
async function assertNoActiveEnrollment(studentId: string, academicYearId: string) {
  const active = await prisma.enrollment.findFirst({ where: { studentId, academicYearId, status: "ACTIVE" } });
  if (active) {
    throw new HttpError(
      409,
      "ENROLLMENT_ALREADY_ACTIVE",
      "Student already has an active enrollment for this academic year — use transfer instead"
    );
  }
}

export async function createEnrollment(
  input: { studentId: string; academicYearId: string; classId: string; sectionId: string; rollNumber?: string },
  actorId: string
) {
  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student || student.status === "ARCHIVED") {
    throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  }

  await assertSectionUsable(input.sectionId, input.classId, input.academicYearId);
  await assertNoActiveEnrollment(input.studentId, input.academicYearId);

  const enrollment = await prisma.$transaction(async (tx) => {
    const created = await tx.enrollment.create({ data: input });
    // Re-admission: enrolling a withdrawn student reactivates them.
    if (student.status === "WITHDRAWN") {
      await tx.student.update({ where: { id: input.studentId }, data: { status: "ACTIVE", withdrawnAt: null } });
    }
    return created;
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Enrollment",
    recordId: enrollment.id,
    newValue: { studentId: input.studentId, classId: input.classId, sectionId: input.sectionId },
  });

  return enrollment;
}

// Spec's Student Transfer workflow: "Change Section/Class → New Enrollment
// Record → Update Roll → Audit." The old enrollment is marked TRANSFERRED
// (not deleted, not silently mutated in place) and a new ACTIVE one is
// created — preserving full history, per "Student ≠ Enrollment."
export async function transferEnrollment(
  enrollmentId: string,
  input: { classId: string; sectionId: string; rollNumber?: string },
  actorId: string
) {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw new HttpError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  if (enrollment.status !== "ACTIVE") {
    throw new HttpError(409, "ENROLLMENT_NOT_ACTIVE", "Only an active enrollment can be transferred");
  }

  await assertSectionUsable(input.sectionId, input.classId, enrollment.academicYearId);

  const newEnrollment = await prisma.$transaction(async (tx) => {
    await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: "TRANSFERRED" } });
    return tx.enrollment.create({
      data: {
        studentId: enrollment.studentId,
        academicYearId: enrollment.academicYearId,
        classId: input.classId,
        sectionId: input.sectionId,
        rollNumber: input.rollNumber,
      },
    });
  });

  await writeAuditLog({
    actorId,
    action: "TRANSFER",
    resource: "Enrollment",
    recordId: newEnrollment.id,
    oldValue: { enrollmentId, classId: enrollment.classId, sectionId: enrollment.sectionId },
    newValue: { classId: input.classId, sectionId: input.sectionId },
  });

  return newEnrollment;
}

export async function withdrawEnrollment(enrollmentId: string, actorId: string) {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw new HttpError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  if (enrollment.status !== "ACTIVE") {
    throw new HttpError(409, "ENROLLMENT_NOT_ACTIVE", "Only an active enrollment can be withdrawn");
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  await writeAuditLog({
    actorId,
    action: "WITHDRAW",
    resource: "Enrollment",
    recordId: enrollmentId,
    oldValue: { status: "ACTIVE" },
    newValue: { status: "WITHDRAWN" },
  });

  return updated;
}
