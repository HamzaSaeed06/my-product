import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, createTestUserWithRole, loginAsTestUser, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let campusId: string;
let academicYearId: string;
let classId: string;
let sectionId: string;
let subjectId: string;
let teacherUserId: string;
let teacherId: string;
let studentAId: string;
let studentBId: string;
let examId: string;
let resultAId: string;
let resultBId: string;
let admissionId: string;
let studentFeeCategoryId: string;
let invoiceId: string;

let teacherOnlyClient: Awaited<ReturnType<typeof loginAsTestUser>>;
let parentClient: Awaited<ReturnType<typeof loginAsTestUser>>;
let parentUserId: string;

const today = new Date();
const dateFrom = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const dateTo = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("Reports & Analytics API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, year, klass, subject] = await Promise.all([
      prisma.campus.create({ data: { name: `Report-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Report-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.class.create({ data: { name: `Report-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.subject.create({ data: { name: `Report-Test Subject ${suffix}`, code: `RPT-${suffix}`, instituteId: institute.id } }),
    ]);
    campusId = campus.id;
    academicYearId = year.id;
    classId = klass.id;
    subjectId = subject.id;

    const section = await prisma.section.create({ data: { classId, campusId, academicYearId, name: "A", capacity: 2 } });
    sectionId = section.id;

    const teacherUser = await createTestUserWithRole({
      email: `report-teacher-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Report Test Teacher",
      roleName: "TEACHER",
    });
    teacherUserId = teacherUser.id;
    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;
    await prisma.teacherAssignment.create({ data: { teacherId, subjectId, classId, sectionId, academicYearId } });
    teacherOnlyClient = await loginAsTestUser(teacherUser.email, PASSWORD);

    const [studentA, studentB] = await Promise.all([
      prisma.student.create({ data: { studentCode: `STU-RPT-A-${suffix}`, fullName: `Report Student A ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-RPT-B-${suffix}`, fullName: `Report Student B ${suffix}` } }),
    ]);
    studentAId = studentA.id;
    studentBId = studentB.id;

    await Promise.all([
      prisma.enrollment.create({ data: { studentId: studentAId, academicYearId, classId, sectionId } }),
      prisma.enrollment.create({ data: { studentId: studentBId, academicYearId, classId, sectionId } }),
    ]);

    // Parent linked to studentA, for permission-boundary checks.
    const parentUser = await createTestUserWithRole({
      email: `report-parent-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Report Test Parent",
      roleName: "PARENT",
    });
    parentUserId = parentUser.id;
    parentClient = await loginAsTestUser(parentUser.email, PASSWORD);

    // Attendance: A present, B absent, on "today".
    await prisma.attendance.createMany({
      data: [
        { studentId: studentAId, sectionId, date: today, status: "PRESENT", markedById: asSuperAdmin().userId },
        { studentId: studentBId, sectionId, date: today, status: "ABSENT", markedById: asSuperAdmin().userId },
      ],
    });

    // Exam + Results: A scores 90/100 (pass), B scores 20/100 (fail).
    const exam = await prisma.exam.create({ data: { academicYearId, name: `Report Exam ${suffix}`, status: "PUBLISHED" } });
    examId = exam.id;
    const [resultA, resultB] = await Promise.all([
      prisma.result.create({ data: { studentId: studentAId, examId, sectionId, status: "PUBLISHED" } }),
      prisma.result.create({ data: { studentId: studentBId, examId, sectionId, status: "PUBLISHED" } }),
    ]);
    resultAId = resultA.id;
    resultBId = resultB.id;
    await Promise.all([
      prisma.resultItem.create({ data: { resultId: resultAId, subjectId, marksObtained: 90, totalMarks: 100 } }),
      prisma.resultItem.create({ data: { resultId: resultBId, subjectId, marksObtained: 20, totalMarks: 100 } }),
    ]);

    // Admission: one APPROVED.
    const admission = await prisma.admission.create({
      data: { studentId: studentAId, campusId, classId, academicYearId, status: "APPROVED", decidedAt: new Date() },
    });
    admissionId = admission.id;

    // Invoice + Payment for financial report.
    const feeCategory = await prisma.feeCategory.create({ data: { name: `Report Fee ${suffix}`, instituteId: institute.id } });
    studentFeeCategoryId = feeCategory.id;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-RPT-${suffix}`,
        studentId: studentAId,
        totalAmount: "1000.00",
        dueDate: new Date(),
        status: "PAID",
        items: { create: [{ feeCategoryId: studentFeeCategoryId, description: "Tuition", amount: "1000.00" }] },
      },
    });
    invoiceId = invoice.id;
    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-RPT-${suffix}`,
        studentId: studentAId,
        amount: "1000.00",
        method: "CASH",
        status: "SUCCESS",
        recordedById: asSuperAdmin().userId,
        allocations: { create: [{ invoiceId, amount: "1000.00", allocationNumber: `ALLOC-RPT-${suffix}` }] },
      },
    });
  }, 60000);

  afterAll(async () => {
    if (invoiceId) {
      await prisma.paymentAllocation.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { paymentNumber: `PAY-RPT-${suffix}` } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: invoiceId } }).catch(() => {});
    }
    if (studentFeeCategoryId) await prisma.feeCategory.deleteMany({ where: { id: studentFeeCategoryId } }).catch(() => {});
    if (admissionId) await prisma.admission.deleteMany({ where: { id: admissionId } }).catch(() => {});
    if (resultAId || resultBId) {
      await prisma.resultItem.deleteMany({ where: { resultId: { in: [resultAId, resultBId].filter(Boolean) } } }).catch(() => {});
      await prisma.result.deleteMany({ where: { id: { in: [resultAId, resultBId].filter(Boolean) } } }).catch(() => {});
    }
    if (examId) await prisma.exam.deleteMany({ where: { id: examId } }).catch(() => {});
    if (sectionId) await prisma.attendance.deleteMany({ where: { sectionId } }).catch(() => {});
    if (teacherId) await prisma.teacherAssignment.deleteMany({ where: { teacherId } }).catch(() => {});
    if (teacherId) await prisma.teacher.deleteMany({ where: { id: teacherId } }).catch(() => {});
    if (teacherUserId) await prisma.user.deleteMany({ where: { id: teacherUserId } }).catch(() => {});
    if (parentUserId) await prisma.user.deleteMany({ where: { id: parentUserId } }).catch(() => {});
    if (sectionId) await prisma.enrollment.deleteMany({ where: { sectionId } }).catch(() => {});
    if (studentAId || studentBId) {
      await prisma.student.deleteMany({ where: { id: { in: [studentAId, studentBId].filter(Boolean) } } }).catch(() => {});
    }
    if (sectionId) await prisma.section.deleteMany({ where: { id: sectionId } }).catch(() => {});
    if (subjectId) await prisma.subject.deleteMany({ where: { id: subjectId } }).catch(() => {});
    if (classId) await prisma.class.deleteMany({ where: { id: classId } }).catch(() => {});
    if (academicYearId) await prisma.academicYear.deleteMany({ where: { id: academicYearId } }).catch(() => {});
    if (campusId) await prisma.campus.deleteMany({ where: { id: campusId } }).catch(() => {});
  });

  describe("Academic report", () => {
    it("computes student performance, class/subject averages, and pass/fail rates", async () => {
      const res = await asSuperAdmin().get(`/api/v1/reports/academic?examId=${examId}`);
      expect(res.status).toBe(200);
      expect(res.body.examId).toBe(examId);

      const perfA = res.body.studentPerformance.find((s: { studentId: string }) => s.studentId === studentAId);
      const perfB = res.body.studentPerformance.find((s: { studentId: string }) => s.studentId === studentBId);
      expect(perfA.percentage).toBe(90);
      expect(perfA.passed).toBe(true);
      expect(perfB.percentage).toBe(20);
      expect(perfB.passed).toBe(false);

      expect(res.body.passFailRates.passed).toBe(1);
      expect(res.body.passFailRates.failed).toBe(1);

      const classPerf = res.body.classPerformance.find((c: { sectionId: string }) => c.sectionId === sectionId);
      expect(classPerf.averagePercentage).toBe(55);

      const subjectPerf = res.body.subjectWiseAnalysis.find((s: { subjectId: string }) => s.subjectId === subjectId);
      expect(subjectPerf.averagePercentage).toBe(55);

      const teacherPerf = res.body.teacherPerformance.find((t: { teacherId: string }) => t.teacherId === teacherId);
      expect(teacherPerf.averagePercentage).toBe(55);
    });

    it("exports academic report as CSV when the actor has report.export", async () => {
      const res = await asSuperAdmin().get(`/api/v1/reports/academic?examId=${examId}&format=csv`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("studentId");
    });
  });

  describe("Attendance report", () => {
    it("computes daily/student/class attendance summaries", async () => {
      const res = await asSuperAdmin().get(`/api/v1/reports/attendance?dateFrom=${dateFrom}&dateTo=${dateTo}&sectionId=${sectionId}`);
      expect(res.status).toBe(200);
      const studentA = res.body.studentWise.find((s: { studentId: string }) => s.studentId === studentAId);
      const studentB = res.body.studentWise.find((s: { studentId: string }) => s.studentId === studentBId);
      expect(studentA.present).toBe(1);
      expect(studentB.absent).toBe(1);
      expect(res.body.monthlySummary.present).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Financial report", () => {
    it("includes the recorded payment in daily collection", async () => {
      const res = await asSuperAdmin().get(`/api/v1/reports/financial?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      expect(res.status).toBe(200);
      const total = res.body.dailyCollection.reduce((sum: number, d: { total: number }) => sum + d.total, 0);
      expect(total).toBeGreaterThanOrEqual(1000);
      expect(res.body.paidInvoicesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Admission report", () => {
    it("counts applications and approval status", async () => {
      const res = await asSuperAdmin().get(
        `/api/v1/reports/admissions?dateFrom=${dateFrom}&dateTo=${dateTo}&campusId=${campusId}&academicYearId=${academicYearId}`
      );
      expect(res.status).toBe(200);
      expect(res.body.applicationsReceived).toBe(1);
      expect(res.body.approvedRejected.approved).toBe(1);
      const capacityRow = res.body.classCapacity.find((c: { sectionId: string }) => c.sectionId === sectionId);
      expect(capacityRow.enrolled).toBe(2);
      expect(capacityRow.capacity).toBe(2);
      expect(capacityRow.utilizationPercentage).toBe(100);
    });
  });

  describe("Staff report", () => {
    it("computes teacher workload", async () => {
      const res = await asSuperAdmin().get(`/api/v1/reports/staff?dateFrom=${dateFrom}&dateTo=${dateTo}&campusId=${campusId}`);
      expect(res.status).toBe(200);
      const workload = res.body.teacherWorkload.find((t: { teacherId: string }) => t.teacherId === teacherId);
      expect(workload.sectionsAssigned).toBe(1);
      expect(workload.subjectsTaught).toBe(1);
    });
  });

  describe("Permission enforcement", () => {
    it("refuses a Teacher (no report.view_academic) from viewing the academic report", async () => {
      const res = await teacherOnlyClient.get(`/api/v1/reports/academic?examId=${examId}`);
      expect(res.status).toBe(403);
    });

    it("refuses a Parent (no report.view_financial) from viewing the financial report", async () => {
      const res = await parentClient.get(`/api/v1/reports/financial?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      expect(res.status).toBe(403);
    });

    it("refuses CSV export for a role without report.export (Incharge has view but not export)", async () => {
      const inchargeUser = await createTestUserWithRole({
        email: `report-incharge-${suffix}@example.test`,
        password: PASSWORD,
        fullName: "Report Test Incharge",
        roleName: "INCHARGE",
      });
      const inchargeClient = await loginAsTestUser(inchargeUser.email, PASSWORD);
      try {
        const viewRes = await inchargeClient.get(`/api/v1/reports/academic?examId=${examId}`);
        expect(viewRes.status).toBe(200);

        const exportRes = await inchargeClient.get(`/api/v1/reports/academic?examId=${examId}&format=csv`);
        expect(exportRes.status).toBe(403);
        expect(exportRes.body.error).toBe("EXPORT_NOT_ALLOWED");
      } finally {
        await prisma.user.delete({ where: { id: inchargeUser.id } }).catch(() => {});
      }
    });
  });
});
