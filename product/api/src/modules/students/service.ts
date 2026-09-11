import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { generateStudentCode } from "../../lib/studentCode.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createDocumentRecord, listDocuments, type DocumentMeta } from "../documents/service.js";

// Spec: "Duplicate Prevention - check before creating new student." Search
// by name, phone, or student code — the frontend calls this before letting
// Office create a new student, and surfaces matches as "possible existing
// student found" rather than silently blocking creation (the office user
// makes the final call).
export async function searchStudents(query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.student.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { studentCode: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: q } },
      ],
    },
    take: 20,
    orderBy: { fullName: "asc" },
  });
}

export async function listStudents(filter: {
  status?: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
  idIn?: string[];
  sectionId?: string;
}) {
  return prisma.student.findMany({
    where: {
      status: filter.status,
      id: filter.idIn ? { in: filter.idIn } : undefined,
      enrollments: filter.sectionId ? { some: { sectionId: filter.sectionId, status: "ACTIVE" } } : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudent(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parents: { include: { parent: true } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: { academicYear: true, klass: true, section: true },
      },
    },
  });
  if (!student) throw new HttpError(404, "STUDENT_NOT_FOUND", "Student not found");
  return student;
}

export async function createStudent(
  input: { fullName: string; dateOfBirth?: Date; gender?: string; phone?: string; address?: string },
  actorId: string
) {
  // Retry on the rare race where two students are created concurrently and
  // both compute the same "next" code before either commits.
  for (let attempt = 0; attempt < 5; attempt++) {
    const studentCode = await generateStudentCode();
    try {
      const student = await prisma.student.create({ data: { ...input, studentCode } });

      await writeAuditLog({
        actorId,
        action: "CREATE",
        resource: "Student",
        recordId: student.id,
        newValue: { studentCode: student.studentCode, fullName: student.fullName },
      });

      return student;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }
  throw new HttpError(500, "STUDENT_CODE_GENERATION_FAILED", "Could not generate a unique student code");
}

// "Student identity corrections" are explicitly a MUST-AUDIT event per spec
// §8 — this covers name/DOB/gender/contact corrections uniformly.
export async function updateStudent(
  id: string,
  input: Partial<{ fullName: string; dateOfBirth: Date; gender: string; phone: string; address: string }>,
  actorId: string
) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new HttpError(404, "STUDENT_NOT_FOUND", "Student not found");

  const updated = await prisma.student.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Student",
    recordId: id,
    oldValue: {
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      phone: student.phone,
      address: student.address,
    },
    newValue: {
      fullName: updated.fullName,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      phone: updated.phone,
      address: updated.address,
    },
  });

  return updated;
}

// Withdrawal ≠ delete (spec). Cascades to the student's currently active
// enrollment, if any — a withdrawn student can't simultaneously have an
// active enrollment.
export async function withdrawStudent(id: string, reason: string | undefined, actorId: string) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new HttpError(404, "STUDENT_NOT_FOUND", "Student not found");
  if (student.status === "WITHDRAWN") {
    throw new HttpError(409, "STUDENT_ALREADY_WITHDRAWN", "Student is already withdrawn");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.student.update({
      where: { id },
      data: { status: "WITHDRAWN", withdrawnAt: new Date() },
    });
    await tx.enrollment.updateMany({
      where: { studentId: id, status: "ACTIVE" },
      data: { status: "WITHDRAWN", withdrawnAt: new Date() },
    });
    return result;
  });

  await writeAuditLog({
    actorId,
    action: "WITHDRAW",
    resource: "Student",
    recordId: id,
    oldValue: { status: student.status },
    newValue: { status: updated.status },
    reason,
  });

  return updated;
}

// Formalizes the Student<->Document link with a real FK row (StudentDocument)
// on top of Phase 0's generic Document model, per spec's explicit model list.
export async function uploadStudentDocument(
  studentId: string,
  file: Express.Multer.File,
  meta: Omit<DocumentMeta, "ownerType" | "ownerId">,
  actorId: string
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new HttpError(404, "STUDENT_NOT_FOUND", "Student not found");

  const document = await createDocumentRecord(file, { ...meta, ownerType: "Student", ownerId: studentId }, actorId);

  await prisma.studentDocument.create({ data: { studentId, documentId: document.id } });

  return document;
}

export async function listStudentDocuments(studentId: string, viewerPermissionKeys: Set<string>) {
  return listDocuments({ ownerType: "Student", ownerId: studentId }, viewerPermissionKeys);
}

export async function archiveStudent(id: string, actorId: string) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new HttpError(404, "STUDENT_NOT_FOUND", "Student not found");
  if (student.status === "ARCHIVED") {
    throw new HttpError(409, "STUDENT_ALREADY_ARCHIVED", "Student is already archived");
  }

  const updated = await prisma.student.update({ where: { id }, data: { status: "ARCHIVED" } });

  await writeAuditLog({
    actorId,
    action: "ARCHIVE",
    resource: "Student",
    recordId: id,
    oldValue: { status: student.status },
    newValue: { status: updated.status },
  });

  return updated;
}
