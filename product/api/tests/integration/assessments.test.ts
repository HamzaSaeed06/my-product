import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let teacherUserId: string;
let teacherId: string;
let studentId: string;
let outsideStudentId: string;
let assessmentId: string;
let resultId: string;
let approvalId: string;

describe("Assessments API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, teacherUser, student, outsideStudent] = await Promise.all([
      prisma.campus.create({ data: { name: `Assess-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Assess-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Assess-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `Assess-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.user.create({ data: { email: `assess-teacher-${suffix}@example.test`, passwordHash: "x", fullName: "Assess Test Teacher" } }),
      prisma.student.create({ data: { studentCode: `STU-ASSESS-${suffix}`, fullName: `Assessment Test ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-ASSESS-OUT-${suffix}`, fullName: `Assessment Outside ${suffix}` } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;
    teacherUserId = teacherUser.id;
    studentId = student.id;
    outsideStudentId = outsideStudent.id;

    const [section, teacher] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.teacher.create({ data: { userId: teacherUserId } }),
    ]);
    sectionId = section.id;
    teacherId = teacher.id;

    await prisma.enrollment.create({ data: { studentId, academicYearId, classId, sectionId } });
  });

  afterAll(async () => {
    await prisma.approvalRequest.deleteMany({ where: { resource: "AssessmentResult", recordId: resultId } });
    await prisma.assessmentResult.deleteMany({ where: { assessmentId } });
    await prisma.assessment.deleteMany({ where: { id: assessmentId } });
    await prisma.enrollment.deleteMany({ where: { sectionId } });
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
    await prisma.student.deleteMany({ where: { id: { in: [studentId, outsideStudentId] } } });
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates an assessment in draft", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/assessments")
      .send({ subjectId, sectionId, classId, academicYearId, teacherId, title: "Midterm Quiz", totalMarks: 20, assessmentDate: "2026-09-20" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("DRAFT");
    assessmentId = res.body.id;
  });

  it("refuses marks outside the valid range", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/results`).send({ studentId, marksObtained: 25 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("MARKS_OUT_OF_RANGE");
  });

  it("refuses entering marks for a student not enrolled in the section", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/results`).send({ studentId: outsideStudentId, marksObtained: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("STUDENT_NOT_ENROLLED");
  });

  it("enters marks while in draft", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/results`).send({ studentId, marksObtained: 15, remarks: "Good" });
    expect(res.status).toBe(200);
    resultId = res.body.id;
  });

  it("re-entering marks in draft overwrites the previous value", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/results`).send({ studentId, marksObtained: 17 });
    expect(res.status).toBe(200);
    expect(res.body.marksObtained).toBe(17);
  });

  it("submits (locks) the assessment", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/submit`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("SUBMITTED");
  });

  it("refuses entering marks directly after submission", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/results`).send({ studentId, marksObtained: 18 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ASSESSMENT_LOCKED");
  });

  it("requests a marks correction after lock", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/results/${resultId}/request-correction`).send({ newMarks: 18, reason: "Calculation error" });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("ASSESSMENT_MARKS_CORRECTION");
    approvalId = res.body.id;
  });

  it("approves the correction, which updates the locked result", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/corrections/${approvalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);

    const result = await prisma.assessmentResult.findUnique({ where: { id: resultId } });
    expect(result?.marksObtained).toBe(18);
  });

  it("refuses re-deciding an already-decided correction", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/corrections/${approvalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("APPROVAL_ALREADY_DECIDED");
  });

  it("archives the assessment", async () => {
    const res = await asSuperAdmin().post(`/api/v1/assessments/${assessmentId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });
});
