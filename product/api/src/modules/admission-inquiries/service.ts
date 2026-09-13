import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createStudent, findStudentByNationalId } from "../students/service.js";
import { createParent, findParentByNationalId, linkChild } from "../parents/service.js";
import { createAdmission } from "../admissions/service.js";

function include() {
  return {
    campus: { select: { id: true, name: true } },
    klass: { select: { id: true, name: true } },
    createdBy: { select: { id: true, fullName: true } },
    convertedStudent: { select: { id: true, studentCode: true, fullName: true } },
  } as const;
}

export async function listAdmissionInquiries(filter: { status?: string; campusIdIn?: string[]; campusId?: string }) {
  return prisma.admissionInquiry.findMany({
    where: {
      status: filter.status as never,
      campusId: filter.campusIdIn ? { in: filter.campusIdIn } : filter.campusId,
    },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdmissionInquiry(id: string) {
  const inquiry = await prisma.admissionInquiry.findUnique({ where: { id }, include: include() });
  if (!inquiry) throw new HttpError(404, "ADMISSION_INQUIRY_NOT_FOUND", "Admission inquiry not found");
  return inquiry;
}

// Thin getter for controllers that need to scope-check an inquiry by id.
export async function getAdmissionInquiryCampusId(id: string): Promise<string> {
  const inquiry = await prisma.admissionInquiry.findUnique({ where: { id }, select: { campusId: true } });
  if (!inquiry) throw new HttpError(404, "ADMISSION_INQUIRY_NOT_FOUND", "Admission inquiry not found");
  return inquiry.campusId;
}

export async function createAdmissionInquiry(
  input: {
    campusId: string;
    classId?: string;
    childName: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    source?: string;
    notes?: string;
  },
  actorId: string
) {
  const inquiry = await prisma.admissionInquiry.create({
    data: { ...input, createdById: actorId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "AdmissionInquiry", recordId: inquiry.id, newValue: input });

  return inquiry;
}

export async function updateAdmissionInquiry(
  id: string,
  input: { classId?: string; parentEmail?: string; notes?: string; status?: "CONTACTED" | "CLOSED" },
  actorId: string
) {
  const inquiry = await prisma.admissionInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new HttpError(404, "ADMISSION_INQUIRY_NOT_FOUND", "Admission inquiry not found");
  if (inquiry.status === "CONVERTED") {
    throw new HttpError(409, "ALREADY_CONVERTED", "This inquiry has already been converted — edit the resulting Admission/Student instead");
  }
  if (input.status && inquiry.status === "CLOSED" && input.status !== "CLOSED") {
    throw new HttpError(409, "ALREADY_CLOSED", "This inquiry is closed");
  }

  const updated = await prisma.admissionInquiry.update({ where: { id }, data: input, include: include() });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "AdmissionInquiry",
    recordId: id,
    oldValue: { status: inquiry.status, notes: inquiry.notes },
    newValue: input,
  });

  return updated;
}

// The one heavyweight action in this module — creates the real Student (+
// Parent, unless reusing an existing one) and the Admission record, then
// marks the inquiry CONVERTED with a link to the new studentId. Nothing
// heavier than the inquiry itself exists until this is deliberately
// called. Reuses createStudent/createParent/linkChild/createAdmission
// rather than duplicating their validation — same "one workflow, many
// callers" principle as Phase 0's approvals engine.
//
// Duplicate handling (spec: "never a silent auto-merge"): if the caller
// supplies a nationalId that already belongs to an existing Student/Parent,
// this refuses rather than silently attaching the inquiry to that
// stranger's record — the caller must explicitly pass existingStudentId/
// existingParentId once a human has confirmed it's genuinely the same
// person (mirrors the frontend's existing "possible match" review step for
// direct Student creation).
export async function convertAdmissionInquiry(
  id: string,
  input: {
    classId: string;
    academicYearId: string;
    existingStudentId?: string;
    studentNationalId?: string;
    studentDateOfBirth?: Date;
    studentGender?: string;
    existingParentId?: string;
    parentNationalId?: string;
  },
  actorId: string
) {
  const inquiry = await prisma.admissionInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new HttpError(404, "ADMISSION_INQUIRY_NOT_FOUND", "Admission inquiry not found");
  if (inquiry.status === "CONVERTED") throw new HttpError(409, "ALREADY_CONVERTED", "This inquiry has already been converted");
  if (inquiry.status === "CLOSED") throw new HttpError(409, "ALREADY_CLOSED", "This inquiry is closed — reopen it first");

  let studentId: string;
  if (input.existingStudentId) {
    const existing = await prisma.student.findUnique({ where: { id: input.existingStudentId } });
    if (!existing) throw new HttpError(400, "STUDENT_NOT_FOUND", "existingStudentId does not reference a real student");
    studentId = existing.id;
  } else {
    if (input.studentNationalId) {
      const match = await findStudentByNationalId(input.studentNationalId);
      if (match) {
        throw new HttpError(
          409,
          "STUDENT_EXISTS_WITH_THIS_ID",
          `A student with this CNIC/B-Form already exists (${match.studentCode}) — pass existingStudentId to link to them instead`
        );
      }
    }
    const student = await createStudent(
      { fullName: inquiry.childName, dateOfBirth: input.studentDateOfBirth, gender: input.studentGender, nationalId: input.studentNationalId },
      actorId
    );
    studentId = student.id;
  }

  let parentId: string;
  if (input.existingParentId) {
    const existing = await prisma.parent.findUnique({ where: { id: input.existingParentId } });
    if (!existing) throw new HttpError(400, "PARENT_NOT_FOUND", "existingParentId does not reference a real parent");
    parentId = existing.id;
  } else {
    if (input.parentNationalId) {
      const match = await findParentByNationalId(input.parentNationalId);
      if (match) {
        throw new HttpError(
          409,
          "PARENT_EXISTS_WITH_THIS_ID",
          "A parent with this CNIC already exists — pass existingParentId to link to them instead"
        );
      }
    }
    const parent = await createParent(
      { fullName: inquiry.parentName, phone: inquiry.parentPhone, email: inquiry.parentEmail ?? undefined, nationalId: input.parentNationalId },
      actorId
    );
    parentId = parent.id;
  }

  const existingLink = await prisma.studentParent.findUnique({ where: { studentId_parentId: { studentId, parentId } } });
  if (!existingLink) {
    await linkChild(parentId, { studentId, isPrimary: true }, actorId);
  }

  const admission = await createAdmission(
    { studentId, campusId: inquiry.campusId, classId: input.classId, academicYearId: input.academicYearId },
    actorId
  );

  const updatedInquiry = await prisma.admissionInquiry.update({
    where: { id },
    data: { status: "CONVERTED", convertedStudentId: studentId },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: "CONVERT",
    resource: "AdmissionInquiry",
    recordId: id,
    newValue: { studentId, parentId, admissionId: admission.id },
  });

  return { inquiry: updatedInquiry, studentId, parentId, admissionId: admission.id };
}
