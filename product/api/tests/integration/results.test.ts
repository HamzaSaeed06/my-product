import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let studentId: string;
let examId: string;
let resultId: string;
let itemId: string;
let approvalId: string;

describe("Results API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, student] = await Promise.all([
      prisma.campus.create({ data: { name: `Result-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Result-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Result-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `Result-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-RESULT-${suffix}`, fullName: `Result Test ${suffix}` } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;
    studentId = student.id;

    const [section, exam] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.exam.create({ data: { academicYearId, name: `Term-${suffix}` } }),
    ]);
    sectionId = section.id;
    examId = exam.id;

    await prisma.enrollment.create({ data: { studentId, academicYearId, classId, sectionId } });
  });

  afterAll(async () => {
    await prisma.approvalRequest.deleteMany({ where: { resource: "ResultItem", recordId: itemId } });
    await prisma.resultItem.deleteMany({ where: { resultId } });
    await prisma.result.deleteMany({ where: { examId } });
    await prisma.enrollment.deleteMany({ where: { sectionId } });
    await prisma.exam.delete({ where: { id: examId } }).catch(() => {});
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("gets-or-creates draft results for a section's active enrollments", async () => {
    const res = await asSuperAdmin().get(`/api/v1/results?examId=${examId}&sectionId=${sectionId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("DRAFT");
    resultId = res.body[0].id;
  });

  it("refuses marks outside the valid range", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/items`).send({ subjectId, marksObtained: 150, totalMarks: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("MARKS_OUT_OF_RANGE");
  });

  it("enters a result item while draft", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/items`).send({ subjectId, marksObtained: 78, totalMarks: 100, grade: "B" });
    expect(res.status).toBe(200);
    itemId = res.body.id;
  });

  it("refuses finalizing directly from draft (must go through submit -> review)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/finalize`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE_TRANSITION");
  });

  it("submits the result", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/submit`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("SUBMITTED");
  });

  it("refuses entering items after submission", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/items`).send({ subjectId, marksObtained: 80, totalMarks: 100 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("RESULT_NOT_DRAFT");
  });

  it("refuses skipping review to finalize", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/finalize`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE_TRANSITION");
  });

  it("reviews the result", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/review`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REVIEWED");
  });

  it("finalizes the result", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/finalize`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("FINALIZED");
  });

  it("publishes the result", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/${resultId}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PUBLISHED");
  });

  it("refuses a correction request with no actual change", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/items/${itemId}/request-correction`).send({ newMarks: 78, reason: "no-op" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("NO_CHANGE");
  });

  it("requests a result correction after publication", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/items/${itemId}/request-correction`).send({ newMarks: 82, reason: "Re-checked paper" });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("RESULT_CORRECTION");
    approvalId = res.body.id;
  });

  it("approves the correction, updating the locked result item", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/corrections/${approvalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);

    const item = await prisma.resultItem.findUnique({ where: { id: itemId } });
    expect(item?.marksObtained).toBe(82);
  });

  it("refuses re-deciding an already-decided correction", async () => {
    const res = await asSuperAdmin().post(`/api/v1/results/corrections/${approvalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("APPROVAL_ALREADY_DECIDED");
  });
});
