import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUserWithRole, loginAsTestUser, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { getTodayQrToken } from "../../src/lib/staffAttendanceQr.js";

// Phase 11 Phase A3 — staff attendance with anti-spoofing verification
// (QR self check-in) and the financial-action gate on recording a payment.

const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let campusId: string;
let academicYearId: string;
let classId: string;
let sectionId: string;
let categoryId: string;
let studentId: string;
let invoiceId: string;

let campusHeadUserId: string;
let campusHeadClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let officeUserId: string;
let officeClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let teacherUserId: string;
let teacherId: string;
let teacherClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let markTargetUserId: string;
let remoteTargetUserId: string;

describe("Staff Attendance API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [campus, year, klass, category] = await Promise.all([
      prisma.campus.create({ data: { name: `StaffAtt-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `StaffAtt-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.class.create({ data: { name: `StaffAtt-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.feeCategory.create({ data: { name: `StaffAtt-Test Category ${suffix}`, instituteId: institute.id } }),
    ]);
    campusId = campus.id;
    academicYearId = year.id;
    classId = klass.id;
    categoryId = category.id;

    const section = await prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } });
    sectionId = section.id;

    const student = await prisma.student.create({ data: { studentCode: `STU-STAFFATT-${suffix}`, fullName: `StaffAtt Student ${suffix}` } });
    studentId = student.id;
    await prisma.enrollment.create({ data: { studentId, academicYearId, classId, sectionId } });

    const [campusHeadRole] = await Promise.all([prisma.role.findUniqueOrThrow({ where: { name: "CAMPUS_HEAD" } })]);

    const campusHeadUser = await createTestUserWithRole({
      email: `staffatt-campushead-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "StaffAtt Test Campus Head",
      roleName: "CAMPUS_HEAD",
    });
    campusHeadUserId = campusHeadUser.id;
    await prisma.userRole.updateMany({ where: { userId: campusHeadUserId, roleId: campusHeadRole.id }, data: { campusId } });
    campusHeadClient = await loginAsTestUser(campusHeadUser.email, PASSWORD);

    const officeRole = await prisma.role.findUniqueOrThrow({ where: { name: "OFFICE" } });
    const officeUser = await createTestUserWithRole({
      email: `staffatt-office-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "StaffAtt Test Office",
      roleName: "OFFICE",
    });
    officeUserId = officeUser.id;
    await prisma.userRole.updateMany({ where: { userId: officeUserId, roleId: officeRole.id }, data: { campusId } });
    officeClient = await loginAsTestUser(officeUser.email, PASSWORD);

    const teacherUser = await createTestUserWithRole({
      email: `staffatt-teacher-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "StaffAtt Test Teacher",
      roleName: "TEACHER",
    });
    teacherUserId = teacherUser.id;
    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;
    teacherClient = await loginAsTestUser(teacherUser.email, PASSWORD);

    const [markTarget, remoteTarget] = await Promise.all([
      prisma.user.create({ data: { email: `staffatt-marktarget-${suffix}@example.test`, passwordHash: "x", fullName: "Mark Target" } }),
      prisma.user.create({ data: { email: `staffatt-remotetarget-${suffix}@example.test`, passwordHash: "x", fullName: "Remote Target" } }),
    ]);
    markTargetUserId = markTarget.id;
    remoteTargetUserId = remoteTarget.id;
  }, 60000);

  afterAll(async () => {
    await prisma.staffAttendance.deleteMany({ where: { campusId } }).catch(() => {});
    if (invoiceId) {
      await prisma.paymentAllocation.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: invoiceId } }).catch(() => {});
    }
    if (studentId) {
      await prisma.payment.deleteMany({ where: { studentId } }).catch(() => {});
      await prisma.enrollment.deleteMany({ where: { studentId } }).catch(() => {});
      await prisma.student.deleteMany({ where: { id: studentId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { id: { in: [markTargetUserId, remoteTargetUserId].filter(Boolean) } } }).catch(() => {});
    if (teacherId) await prisma.teacher.deleteMany({ where: { id: teacherId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [teacherUserId, officeUserId, campusHeadUserId].filter(Boolean) } } }).catch(() => {});
    if (categoryId) await prisma.feeCategory.deleteMany({ where: { id: categoryId } }).catch(() => {});
    if (sectionId) await prisma.section.deleteMany({ where: { id: sectionId } }).catch(() => {});
    if (classId) await prisma.class.deleteMany({ where: { id: classId } }).catch(() => {});
    if (academicYearId) await prisma.academicYear.deleteMany({ where: { id: academicYearId } }).catch(() => {});
    if (campusId) await prisma.campus.deleteMany({ where: { id: campusId } }).catch(() => {});
  });

  it("a Teacher cannot fetch the QR display token (restricted to whoever manages the display)", async () => {
    const res = await teacherClient.get(`/api/v1/staff-attendance/qr-token?campusId=${campusId}`);
    expect(res.status).toBe(403);
  });

  it("Campus Head fetches today's QR display token", async () => {
    const res = await campusHeadClient.get(`/api/v1/staff-attendance/qr-token?campusId=${campusId}`);
    expect(res.status).toBe(200);
    expect(res.body.token).toBe(getTodayQrToken(campusId));
  });

  it("refuses a check-in with an invalid QR token", async () => {
    const res = await teacherClient.post("/api/v1/staff-attendance/check-in").send({ campusId, token: "not-the-real-token" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_QR_TOKEN");
  });

  it("a Teacher checks in via QR with the real token", async () => {
    const token = getTodayQrToken(campusId);
    const res = await teacherClient.post("/api/v1/staff-attendance/check-in").send({ campusId, token });
    expect(res.status).toBe(201);
    expect(res.body.checkInMethod).toBe("QR");
    expect(res.body.verifiedStatus).toBe("VERIFIED");
  });

  it("refuses a second check-in the same day", async () => {
    const token = getTodayQrToken(campusId);
    const res = await teacherClient.post("/api/v1/staff-attendance/check-in").send({ campusId, token });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_CHECKED_IN");
  });

  it("the Teacher's own /staff-attendance/mine shows today's check-in", async () => {
    const res = await teacherClient.get("/api/v1/staff-attendance/mine");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("refuses recording a payment before Office has checked in today", async () => {
    const invoiceRes = await officeClient
      .post("/api/v1/invoices")
      .send({ studentId, dueDate: "2026-09-30", items: [{ feeCategoryId: categoryId, description: "Fee", amount: "1000.00" }] });
    expect(invoiceRes.status).toBe(201);
    invoiceId = invoiceRes.body.id;

    const res = await officeClient.post("/api/v1/payments").send({ studentId, invoiceId, amount: "500.00" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("NOT_CHECKED_IN_TODAY");
  });

  it("Office checks in via QR, then can record the payment", async () => {
    const token = getTodayQrToken(campusId);
    const checkinRes = await officeClient.post("/api/v1/staff-attendance/check-in").send({ campusId, token });
    expect(checkinRes.status).toBe(201);

    const res = await officeClient.post("/api/v1/payments").send({ studentId, invoiceId, amount: "500.00" });
    expect(res.status).toBe(201);
  });

  it("Campus Head manually marks another staff member present (MANUAL_OVERRIDE)", async () => {
    const res = await campusHeadClient.post("/api/v1/staff-attendance/mark").send({ targetUserId: markTargetUserId, campusId });
    expect(res.status).toBe(201);
    expect(res.body.checkInMethod).toBe("MANUAL");
    expect(res.body.verifiedStatus).toBe("MANUAL_OVERRIDE");
  });

  it("Campus Head grants REMOTE_APPROVED for legitimate remote work", async () => {
    const res = await campusHeadClient.post("/api/v1/staff-attendance/remote-approve").send({ targetUserId: remoteTargetUserId, campusId });
    expect(res.status).toBe(201);
    expect(res.body.checkInMethod).toBe("REMOTE_APPROVED");
    expect(res.body.verifiedStatus).toBe("VERIFIED");
  });

  it("Campus Head lists all of today's check-ins for their campus", async () => {
    const res = await campusHeadClient.get(`/api/v1/staff-attendance?campusId=${campusId}`);
    expect(res.status).toBe(200);
    // Teacher (QR) + Office (QR) + markTarget (MANUAL) + remoteTarget (REMOTE_APPROVED)
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });
});
