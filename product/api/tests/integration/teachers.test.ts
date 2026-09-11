import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashPassword } from "../../src/lib/password.js";

const suffix = uniqueSuffix();
let teacherUserId: string;
let nonTeacherUserId: string;
let teacherId: string | undefined;

describe("Teachers API (real database)", () => {
  beforeAll(async () => {
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: "TEACHER" } });
    const passwordHash = await hashPassword("Str0ng!Passw0rd");

    const [teacherUser, nonTeacherUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: `teacher-${suffix}@example.test`,
          passwordHash,
          fullName: "Test Teacher",
          userRoles: { create: { roleId: teacherRole.id } },
        },
      }),
      prisma.user.create({
        data: { email: `not-teacher-${suffix}@example.test`, passwordHash, fullName: "Not Teacher" },
      }),
    ]);
    teacherUserId = teacherUser.id;
    nonTeacherUserId = nonTeacherUser.id;
  });

  afterAll(async () => {
    if (teacherId) {
      await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { id: { in: [teacherUserId, nonTeacherUserId] } } });
  });

  it("refuses to create a Teacher profile for a user without the TEACHER role", async () => {
    const res = await asSuperAdmin().post("/api/v1/teachers").send({ userId: nonTeacherUserId });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("USER_NOT_TEACHER");
  });

  it("creates a Teacher profile", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/teachers")
      .send({ userId: teacherUserId, employeeCode: `EMP-${suffix}` });
    expect(res.status).toBe(201);
    teacherId = res.body.id;
  });

  it("refuses a duplicate Teacher profile for the same user", async () => {
    const res = await asSuperAdmin().post("/api/v1/teachers").send({ userId: teacherUserId });
    expect(res.status).toBe(409);
  });

  it("updates the teacher", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/teachers/${teacherId}`).send({ qualification: "M.Ed" });
    expect(res.status).toBe(200);
    expect(res.body.qualification).toBe("M.Ed");
  });

  it("lists teachers including the new one", async () => {
    const res = await asSuperAdmin().get("/api/v1/teachers");
    expect(res.status).toBe(200);
    expect(res.body.some((t: { id: string }) => t.id === teacherId)).toBe(true);
  });

  it("archives the teacher (no active assignments)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/teachers/${teacherId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ARCHIVED");
  });
});
