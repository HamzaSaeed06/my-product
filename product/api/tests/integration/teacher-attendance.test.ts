import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let teacherUserId: string;
let teacherId: string;
let recordId: string;

describe("Teacher Attendance API (real database)", () => {
  beforeAll(async () => {
    const teacherUser = await prisma.user.create({
      data: { email: `tattend-${suffix}@example.test`, passwordHash: "x", fullName: "TAttend Test Teacher" },
    });
    teacherUserId = teacherUser.id;
    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;
  });

  afterAll(async () => {
    await prisma.teacherAttendance.deleteMany({ where: { teacherId } });
    await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
  });

  it("marks teacher attendance", async () => {
    const res = await asSuperAdmin().post("/api/v1/teacher-attendance").send({ teacherId, date: "2026-09-14", status: "ABSENT" });
    expect(res.status).toBe(201);
    recordId = res.body.id;
  });

  it("refuses marking the same teacher twice for the same date", async () => {
    const res = await asSuperAdmin().post("/api/v1/teacher-attendance").send({ teacherId, date: "2026-09-14", status: "PRESENT" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_MARKED");
  });

  it("lists teacher attendance filtered by teacher", async () => {
    const res = await asSuperAdmin().get(`/api/v1/teacher-attendance?teacherId=${teacherId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("ABSENT");
  });

  it("corrects teacher attendance directly", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/teacher-attendance/${recordId}`).send({ status: "PRESENT" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PRESENT");
  });
});
