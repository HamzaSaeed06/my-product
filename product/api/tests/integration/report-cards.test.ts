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
let reportCardId: string;

describe("Report Cards API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, student] = await Promise.all([
      prisma.campus.create({ data: { name: `RC-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `RC-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `RC-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `RC-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-RC-${suffix}`, fullName: `Report Card Test ${suffix}` } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;
    studentId = student.id;

    const [section, exam] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.exam.create({ data: { academicYearId, name: `RC-Exam-${suffix}` } }),
    ]);
    sectionId = section.id;
    examId = exam.id;

    await prisma.enrollment.create({ data: { studentId, academicYearId, classId, sectionId } });

    const result = await prisma.result.create({ data: { studentId, examId, sectionId } });
    resultId = result.id;
    await prisma.resultItem.create({ data: { resultId, subjectId, marksObtained: 90, totalMarks: 100, grade: "A" } });
  });

  afterAll(async () => {
    await prisma.reportCard.deleteMany({ where: { resultId } });
    await prisma.resultItem.deleteMany({ where: { resultId } });
    await prisma.result.deleteMany({ where: { id: resultId } });
    await prisma.enrollment.deleteMany({ where: { sectionId } });
    await prisma.exam.delete({ where: { id: examId } }).catch(() => {});
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("refuses generating a report card for a non-finalized result", async () => {
    const res = await asSuperAdmin().post("/api/v1/report-cards").send({ resultId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("RESULT_NOT_LOCKED");
  });

  it("generates a report card once the result is finalized", async () => {
    await prisma.result.update({ where: { id: resultId }, data: { status: "FINALIZED", finalizedAt: new Date() } });

    const res = await asSuperAdmin().post("/api/v1/report-cards").send({ resultId });
    expect(res.status).toBe(201);
    expect(res.body.snapshot.items).toHaveLength(1);
    expect(res.body.snapshot.items[0].marksObtained).toBe(90);
    reportCardId = res.body.id;
  });

  it("regenerating overwrites the existing snapshot rather than duplicating", async () => {
    await prisma.resultItem.updateMany({ where: { resultId }, data: { marksObtained: 95 } });

    const res = await asSuperAdmin().post("/api/v1/report-cards").send({ resultId });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(reportCardId);
    expect(res.body.snapshot.items[0].marksObtained).toBe(95);
  });

  it("lists report cards filtered by exam", async () => {
    const res = await asSuperAdmin().get(`/api/v1/report-cards?examId=${examId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("gets a single report card", async () => {
    const res = await asSuperAdmin().get(`/api/v1/report-cards/${reportCardId}`);
    expect(res.status).toBe(200);
    expect(res.body.result.student.id).toBe(studentId);
  });
});
