import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

// Stores a JSON snapshot of the result at generation time, not a rendered
// PDF — no PDF-generation library is chosen yet (see schema.prisma's Phase
// 4 header comment). Regenerating (e.g. after an approved correction)
// overwrites the snapshot rather than creating a second record.
export async function generateReportCard(resultId: string, actorId: string) {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: { student: true, exam: true, items: { include: { subject: true } } },
  });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  if (result.status !== "FINALIZED" && result.status !== "PUBLISHED") {
    throw new HttpError(409, "RESULT_NOT_LOCKED", "A report card can only be generated for a finalized or published result");
  }

  const snapshot = {
    studentName: result.student.fullName,
    studentCode: result.student.studentCode,
    examName: result.exam.name,
    generatedAt: new Date().toISOString(),
    items: result.items.map((item) => ({
      subject: item.subject.name,
      marksObtained: item.marksObtained,
      totalMarks: item.totalMarks,
      grade: item.grade,
      remarks: item.remarks,
    })),
  };

  const reportCard = await prisma.reportCard.upsert({
    where: { resultId },
    create: { resultId, snapshot, generatedById: actorId },
    update: { snapshot, generatedById: actorId, generatedAt: new Date() },
  });

  await writeAuditLog({ actorId, action: "GENERATE", resource: "ReportCard", recordId: reportCard.id, newValue: { resultId } });

  return reportCard;
}

export async function listReportCards(filter: { examId?: string; studentId?: string }) {
  return prisma.reportCard.findMany({
    where: {
      result: {
        examId: filter.examId,
        studentId: filter.studentId,
      },
    },
    include: { result: { include: { student: true, exam: true } } },
    orderBy: { generatedAt: "desc" },
  });
}

export async function getReportCard(id: string) {
  const reportCard = await prisma.reportCard.findUnique({
    where: { id },
    include: { result: { include: { student: true, exam: true } } },
  });
  if (!reportCard) throw new HttpError(404, "REPORT_CARD_NOT_FOUND", "Report card not found");
  return reportCard;
}
