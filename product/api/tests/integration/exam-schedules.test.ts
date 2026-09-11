import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectAId: string;
let subjectBId: string;
let examId: string;
let scheduleId: string;

describe("Exam Schedules API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subjectA, subjectB] = await Promise.all([
      prisma.campus.create({ data: { name: `ExamSched-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `ExamSched-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `ExamSched-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `ExamSched-Test Subject A ${suffix}`, instituteId: institute.id } }),
      prisma.subject.create({ data: { name: `ExamSched-Test Subject B ${suffix}`, instituteId: institute.id } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectAId = subjectA.id;
    subjectBId = subjectB.id;

    const [section, exam] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.exam.create({ data: { academicYearId, name: `Final-${suffix}` } }),
    ]);
    sectionId = section.id;
    examId = exam.id;
  });

  afterAll(async () => {
    await prisma.examSchedule.deleteMany({ where: { examId } });
    await prisma.exam.delete({ where: { id: examId } }).catch(() => {});
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.subject.deleteMany({ where: { id: { in: [subjectAId, subjectBId] } } });
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates an exam schedule entry", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/exam-schedules")
      .send({ examId, subjectId: subjectAId, classId, sectionId, date: "2026-12-01", startTime: "09:00", endTime: "11:00" });
    expect(res.status).toBe(201);
    scheduleId = res.body.id;
  });

  it("refuses an overlapping time slot for the same section/date", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/exam-schedules")
      .send({ examId, subjectId: subjectBId, classId, sectionId, date: "2026-12-01", startTime: "10:00", endTime: "12:00" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("SCHEDULE_CONFLICT");
  });

  it("allows a non-overlapping time slot the same day", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/exam-schedules")
      .send({ examId, subjectId: subjectBId, classId, sectionId, date: "2026-12-01", startTime: "12:00", endTime: "14:00" });
    expect(res.status).toBe(201);
  });

  it("refuses a duplicate subject for the same section/exam", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/exam-schedules")
      .send({ examId, subjectId: subjectAId, classId, sectionId, date: "2026-12-02", startTime: "09:00", endTime: "11:00" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("SCHEDULE_EXISTS");
  });

  it("lists schedules for the exam", async () => {
    const res = await asSuperAdmin().get(`/api/v1/exam-schedules?examId=${examId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("updates a schedule to a new non-conflicting time", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/exam-schedules/${scheduleId}`).send({ startTime: "08:00", endTime: "08:30" });
    expect(res.status).toBe(200);
    expect(res.body.startTime).toBe("08:00");
  });
});
