import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashPassword } from "../../src/lib/password.js";

// Phase 11 Phase B — Leave & Complaint auto-routing (Office/Parent/Teacher
// creates → auto-resolves the student's Incharge via InchargeScope →
// Incharge can forward to the section's Class Teacher). One shared fixture
// (Campus/Year/Class/Section-with-classTeacher/InchargeScope/Enrollment)
// covers both modules since they use the identical resolution mechanism.

const suffix = uniqueSuffix();
let campusId: string;
let academicYearId: string;
let classId: string;
let sectionId: string;
let inchargeUserId: string;
let classTeacherUserId: string;
let scopeId: string;
let studentId: string;
let leaveId: string;
let complaintId: string;

describe("Leave & Complaint auto-routing (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const inchargeRole = await prisma.role.findUniqueOrThrow({ where: { name: "INCHARGE" } });
    const passwordHash = await hashPassword("Str0ng!Passw0rd");

    const [inchargeUser, classTeacherUser, campus, year, klass, student] = await Promise.all([
      prisma.user.create({
        data: {
          email: `routing-incharge-${suffix}@example.test`,
          passwordHash,
          fullName: "Routing Test Incharge",
          userRoles: { create: { roleId: inchargeRole.id } },
        },
      }),
      prisma.user.create({
        data: { email: `routing-classteacher-${suffix}@example.test`, passwordHash, fullName: "Routing Test Class Teacher" },
      }),
      prisma.campus.create({ data: { name: `Routing-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Routing-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.class.create({ data: { name: `Routing-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-ROUTE-${suffix}`, fullName: `Routing Test Student ${suffix}` } }),
    ]);

    inchargeUserId = inchargeUser.id;
    classTeacherUserId = classTeacherUser.id;
    campusId = campus.id;
    academicYearId = year.id;
    classId = klass.id;
    studentId = student.id;

    const section = await prisma.section.create({
      data: { classId, campusId, academicYearId, name: `Routing-${suffix}`, classTeacherId: classTeacherUserId },
    });
    sectionId = section.id;

    const scope = await prisma.inchargeScope.create({
      data: { userId: inchargeUserId, campusId, academicYearId, createdBy: inchargeUserId, classes: { create: { classId } } },
    });
    scopeId = scope.id;

    await prisma.enrollment.create({
      data: { studentId, sectionId, classId, academicYearId, status: "ACTIVE", rollNumber: "1" },
    });
  });

  afterAll(async () => {
    if (leaveId) await prisma.leave.deleteMany({ where: { id: leaveId } }).catch(() => {});
    if (complaintId) await prisma.complaintNote.deleteMany({ where: { complaintId } }).catch(() => {});
    if (complaintId) await prisma.complaint.deleteMany({ where: { id: complaintId } }).catch(() => {});
    if (studentId) await prisma.enrollment.deleteMany({ where: { studentId } }).catch(() => {});
    if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    if (scopeId) await prisma.inchargeScope.delete({ where: { id: scopeId } }).catch(() => {});
    if (sectionId) await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    if (academicYearId) await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    if (campusId) await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
    if (inchargeUserId) await prisma.user.delete({ where: { id: inchargeUserId } }).catch(() => {});
    if (classTeacherUserId) await prisma.user.delete({ where: { id: classTeacherUserId } }).catch(() => {});
  });

  describe("Leaves", () => {
    it("auto-assigns a new student leave to the section's Incharge", async () => {
      const res = await asSuperAdmin()
        .post("/api/v1/leaves")
        .send({ subjectType: "STUDENT", studentId, fromDate: "2026-10-01", toDate: "2026-10-02", reason: "Fever" });
      expect(res.status).toBe(201);
      expect(res.body.assignedTo?.id).toBe(inchargeUserId);
      leaveId = res.body.id;
    });

    it("the Incharge received a notification", async () => {
      const notifications = await prisma.notification.findMany({ where: { userId: inchargeUserId, title: "New leave request" } });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it("forwards the leave to the section's Class Teacher", async () => {
      const res = await asSuperAdmin().post(`/api/v1/leaves/${leaveId}/forward`);
      expect(res.status).toBe(200);
      expect(res.body.assignedTo?.id).toBe(classTeacherUserId);
    });

    it("the Class Teacher received a forward notification", async () => {
      const notifications = await prisma.notification.findMany({ where: { userId: classTeacherUserId, title: "Leave request forwarded to you" } });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it("refuses forwarding an already-decided leave", async () => {
      await asSuperAdmin().post(`/api/v1/leaves/${leaveId}/decide`).send({ decision: "APPROVED" });
      const res = await asSuperAdmin().post(`/api/v1/leaves/${leaveId}/forward`);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("ALREADY_DECIDED");
    });
  });

  describe("Complaints", () => {
    it("auto-assigns a new student complaint to the section's Incharge and lands directly in ASSIGNED", async () => {
      const res = await asSuperAdmin()
        .post("/api/v1/complaints")
        .send({ studentId, category: "Bullying", description: "Routing test complaint" });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ASSIGNED");
      expect(res.body.assignedTo?.id).toBe(inchargeUserId);
      complaintId = res.body.id;
    });

    it("the Incharge received a notification", async () => {
      const notifications = await prisma.notification.findMany({ where: { userId: inchargeUserId, title: "New complaint assigned" } });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it("forwards the complaint to the section's Class Teacher, status unchanged", async () => {
      const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/forward`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ASSIGNED");
      expect(res.body.assignedTo?.id).toBe(classTeacherUserId);
    });

    it("the Class Teacher received a forward notification", async () => {
      const notifications = await prisma.notification.findMany({ where: { userId: classTeacherUserId, title: "Complaint forwarded to you" } });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });
});
