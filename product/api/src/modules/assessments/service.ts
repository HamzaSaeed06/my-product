import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createApprovalRequest } from "../approvals/service.js";

function include() {
  return {
    subject: true,
    section: true,
    klass: true,
    teacher: { include: { user: true } },
    results: { include: { student: { select: { id: true, fullName: true, studentCode: true } } } },
  } as const;
}

export async function createAssessment(
  input: {
    subjectId: string;
    sectionId: string;
    classId: string;
    academicYearId: string;
    teacherId: string;
    title: string;
    totalMarks: number;
    assessmentDate: Date;
  },
  actorId: string
) {
  const [subject, section, teacher] = await Promise.all([
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.section.findUnique({ where: { id: input.sectionId } }),
    prisma.teacher.findUnique({ where: { id: input.teacherId } }),
  ]);
  if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");
  if (section.classId !== input.classId) throw new HttpError(400, "SECTION_CLASS_MISMATCH", "This section does not belong to the given class");
  if (section.academicYearId !== input.academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "This section does not belong to the given academic year");
  }

  const assessment = await prisma.assessment.create({ data: input, include: include() });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Assessment", recordId: assessment.id, newValue: input });

  return assessment;
}

export async function listAssessments(filter: {
  subjectId?: string;
  academicYearId?: string;
  scope: { sectionId?: string } | { section: { campusId: { in: string[] } } };
}) {
  const { scope, ...rest } = filter;
  return prisma.assessment.findMany({ where: { ...rest, ...scope, archivedAt: null }, include: include(), orderBy: { assessmentDate: "desc" } });
}

export async function getAssessment(id: string) {
  const assessment = await prisma.assessment.findUnique({ where: { id }, include: include() });
  if (!assessment) throw new HttpError(404, "ASSESSMENT_NOT_FOUND", "Assessment not found");
  return assessment;
}

// Thin getters for controllers that need to scope-check an assessment (or
// one of its results, by assessmentResultId) before acting on it.
export async function getAssessmentSectionId(id: string): Promise<string> {
  const assessment = await prisma.assessment.findUnique({ where: { id }, select: { sectionId: true } });
  if (!assessment) throw new HttpError(404, "ASSESSMENT_NOT_FOUND", "Assessment not found");
  return assessment.sectionId;
}

export async function getAssessmentResultSectionId(assessmentResultId: string): Promise<string> {
  const result = await prisma.assessmentResult.findUnique({
    where: { id: assessmentResultId },
    select: { assessment: { select: { sectionId: true } } },
  });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Assessment result not found");
  return result.assessment.sectionId;
}

// Entering marks is only allowed while DRAFT — once SUBMITTED, marks are
// locked and any change must go through requestMarksCorrection (spec:
// "After submission, editing requires approval").
export async function enterMarks(
  assessmentId: string,
  input: { studentId: string; marksObtained: number; remarks?: string },
  actorId: string
) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment || assessment.archivedAt) throw new HttpError(404, "ASSESSMENT_NOT_FOUND", "Assessment not found");
  if (assessment.status === "SUBMITTED") {
    throw new HttpError(409, "ASSESSMENT_LOCKED", "Marks are locked — request a correction instead");
  }
  if (input.marksObtained < 0 || input.marksObtained > assessment.totalMarks) {
    throw new HttpError(400, "MARKS_OUT_OF_RANGE", `marksObtained must be between 0 and ${assessment.totalMarks}`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: input.studentId, sectionId: assessment.sectionId, status: "ACTIVE" },
  });
  if (!enrollment) throw new HttpError(400, "STUDENT_NOT_ENROLLED", "Student is not actively enrolled in this section");

  const result = await prisma.assessmentResult.upsert({
    where: { assessmentId_studentId: { assessmentId, studentId: input.studentId } },
    create: { assessmentId, studentId: input.studentId, marksObtained: input.marksObtained, remarks: input.remarks },
    update: { marksObtained: input.marksObtained, remarks: input.remarks },
  });

  await writeAuditLog({
    actorId,
    action: "UPSERT",
    resource: "AssessmentResult",
    recordId: result.id,
    newValue: { studentId: input.studentId, marksObtained: input.marksObtained },
  });

  return result;
}

export async function submitAssessment(id: string, actorId: string) {
  const assessment = await prisma.assessment.findUnique({ where: { id } });
  if (!assessment || assessment.archivedAt) throw new HttpError(404, "ASSESSMENT_NOT_FOUND", "Assessment not found");
  if (assessment.status === "SUBMITTED") throw new HttpError(409, "ALREADY_SUBMITTED", "Assessment already submitted");

  const updated = await prisma.assessment.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "SUBMIT", resource: "Assessment", recordId: id, newValue: { status: "SUBMITTED" } });

  return updated;
}

export async function archiveAssessment(id: string, actorId: string) {
  const assessment = await prisma.assessment.findUnique({ where: { id } });
  if (!assessment) throw new HttpError(404, "ASSESSMENT_NOT_FOUND", "Assessment not found");
  if (assessment.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Assessment already archived");

  const updated = await prisma.assessment.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "Assessment", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}

export async function requestMarksCorrection(
  assessmentResultId: string,
  input: { newMarks: number; reason: string },
  actorId: string
) {
  const result = await prisma.assessmentResult.findUnique({ where: { id: assessmentResultId }, include: { assessment: true } });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Assessment result not found");
  if (result.assessment.status !== "SUBMITTED") {
    throw new HttpError(400, "NOT_SUBMITTED", "Only marks on a submitted (locked) assessment need a correction request — edit directly instead");
  }
  if (input.newMarks < 0 || input.newMarks > result.assessment.totalMarks) {
    throw new HttpError(400, "MARKS_OUT_OF_RANGE", `newMarks must be between 0 and ${result.assessment.totalMarks}`);
  }
  if (input.newMarks === result.marksObtained) {
    throw new HttpError(400, "NO_CHANGE", "Requested marks are the same as the current marks");
  }

  const section = await prisma.section.findUnique({ where: { id: result.assessment.sectionId }, select: { campusId: true } });

  return createApprovalRequest({
    type: "ASSESSMENT_MARKS_CORRECTION",
    resource: "AssessmentResult",
    recordId: assessmentResultId,
    requestedById: actorId,
    approverRole: "INCHARGE",
    payload: { assessmentResultId, oldMarks: result.marksObtained, newMarks: input.newMarks, reason: input.reason },
    campusId: section?.campusId,
  });
}

// Applies the effect directly here (not in the generic approvals module) —
// same reasoning as attendance/service.ts's decideAttendanceCorrection.
export async function decideMarksCorrection(
  approvalRequestId: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
  if (!request || request.type !== "ASSESSMENT_MARKS_CORRECTION") {
    throw new HttpError(404, "CORRECTION_NOT_FOUND", "Marks correction request not found");
  }
  if (request.status !== "PENDING") {
    throw new HttpError(409, "APPROVAL_ALREADY_DECIDED", `Request already ${request.status.toLowerCase()}`);
  }

  const payload = request.payload as { assessmentResultId: string; oldMarks: number; newMarks: number; reason: string };

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const req = await tx.approvalRequest.update({
      where: { id: approvalRequestId },
      data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
    });
    if (decision === "APPROVED") {
      await tx.assessmentResult.update({ where: { id: payload.assessmentResultId }, data: { marksObtained: payload.newMarks } });
    }
    return req;
  });

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "AssessmentResult",
    recordId: payload.assessmentResultId,
    oldValue: { marksObtained: payload.oldMarks },
    newValue: decision === "APPROVED" ? { marksObtained: payload.newMarks } : undefined,
    reason: payload.reason,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updatedRequest;
}
