import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let studentId: string;
let teacherUserId: string;
let teacherId: string;
let studentLeaveId: string;
let teacherLeaveId: string;

describe("Leaves API (real database)", () => {
  beforeAll(async () => {
    const [student, teacherUser] = await Promise.all([
      prisma.student.create({ data: { studentCode: `STU-LEAVE-${suffix}`, fullName: `Leave Test ${suffix}` } }),
      prisma.user.create({ data: { email: `leave-teacher-${suffix}@example.test`, passwordHash: "x", fullName: "Leave Test Teacher" } }),
    ]);
    studentId = student.id;
    teacherUserId = teacherUser.id;
    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;
  });

  afterAll(async () => {
    if (studentId) await prisma.leave.deleteMany({ where: { studentId } }).catch(() => {});
    if (teacherId) await prisma.leave.deleteMany({ where: { teacherId } }).catch(() => {});
    if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    if (teacherId) await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    if (teacherUserId) await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
  });

  it("refuses a STUDENT leave with a teacherId set", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/leaves")
      .send({ subjectType: "STUDENT", studentId, teacherId, fromDate: "2026-10-01", toDate: "2026-10-02", reason: "Fever" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("SUBJECT_MISMATCH");
  });

  it("creates a student leave request", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/leaves")
      .send({ subjectType: "STUDENT", studentId, fromDate: "2026-10-01", toDate: "2026-10-02", reason: "Fever" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    studentLeaveId = res.body.id;
  });

  it("creates a retrospective teacher leave (fromDate in the past)", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/leaves")
      .send({ subjectType: "TEACHER", teacherId, fromDate: "2020-01-01", toDate: "2020-01-02", reason: "Emergency" });
    expect(res.status).toBe(201);
    expect(res.body.isRetrospective).toBe(true);
    teacherLeaveId = res.body.id;
  });

  it("lists leaves filtered by student", async () => {
    const res = await asSuperAdmin().get(`/api/v1/leaves?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("approves the student leave", async () => {
    const res = await asSuperAdmin().post(`/api/v1/leaves/${studentLeaveId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("refuses re-deciding an already-decided leave", async () => {
    const res = await asSuperAdmin().post(`/api/v1/leaves/${studentLeaveId}/decide`).send({ decision: "REJECTED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_DECIDED");
  });

  it("cancels the approved leave", async () => {
    const res = await asSuperAdmin().post(`/api/v1/leaves/${studentLeaveId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
  });

  it("refuses cancelling an already-cancelled leave", async () => {
    const res = await asSuperAdmin().post(`/api/v1/leaves/${studentLeaveId}/cancel`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CANNOT_CANCEL");
  });

  it("rejects the teacher leave", async () => {
    const res = await asSuperAdmin().post(`/api/v1/leaves/${teacherLeaveId}/decide`).send({ decision: "REJECTED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REJECTED");
  });
});
