import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashPassword } from "../../src/lib/password.js";
import { uniqueSuffix } from "./helpers.js";

// Phase 11 Phase C-addendum — login stops being email-only: a family with
// no email can log in with the parent's CNIC; a student with neither email
// nor CNIC yet still has their own studentCode.

const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let studentUserId: string;
let studentId: string;
let parentUserId: string;
let parentId: string;

describe("Login by identifier (real database)", () => {
  beforeAll(async () => {
    const studentRole = await prisma.role.findUniqueOrThrow({ where: { name: "STUDENT" } });
    const parentRole = await prisma.role.findUniqueOrThrow({ where: { name: "PARENT" } });
    const passwordHash = await hashPassword(PASSWORD);

    const [studentUser, parentUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: `login-id-student-${suffix}@example.test`,
          passwordHash,
          fullName: "Login Identifier Test Student",
          userRoles: { create: { roleId: studentRole.id } },
        },
      }),
      prisma.user.create({
        data: {
          email: `login-id-parent-${suffix}@example.test`,
          passwordHash,
          fullName: "Login Identifier Test Parent",
          userRoles: { create: { roleId: parentRole.id } },
        },
      }),
    ]);
    studentUserId = studentUser.id;
    parentUserId = parentUser.id;

    const [student, parent] = await Promise.all([
      prisma.student.create({
        data: { studentCode: `STU-LOGINID-${suffix}`, fullName: `Login Id Student ${suffix}`, nationalId: `CNIC-STU-LOGIN-${suffix}`, userId: studentUserId },
      }),
      prisma.parent.create({
        data: { fullName: `Login Id Parent ${suffix}`, phone: "03001112222", nationalId: `CNIC-PARENT-LOGIN-${suffix}`, userId: parentUserId },
      }),
    ]);
    studentId = student.id;
    parentId = parent.id;
  });

  afterAll(async () => {
    if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    if (parentId) await prisma.parent.delete({ where: { id: parentId } }).catch(() => {});
    if (studentUserId) await prisma.user.delete({ where: { id: studentUserId } }).catch(() => {});
    if (parentUserId) await prisma.user.delete({ where: { id: parentUserId } }).catch(() => {});
  });

  // A fresh createApp() per test, not a shared module-level instance — the
  // login rate limiter (5/min per IP, PRODUCT_SPEC.md §8 correction #15) is
  // in-memory per Express app instance, and this file alone makes 5 login
  // calls; sharing one instance would run right up against that limit for
  // no reason. Mirrors the existing pattern in helpers.ts (every helper
  // there also calls createApp() fresh, not a shared module-level app).
  it("logs in with a real email (unchanged behavior)", async () => {
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: `login-id-student-${suffix}@example.test`, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(studentUserId);
  });

  it("logs in a student with their studentCode (no email/CNIC needed)", async () => {
    const res = await request(createApp()).post("/api/v1/auth/login").send({ identifier: `STU-LOGINID-${suffix}`, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(studentUserId);
  });

  it("logs in a student with their own CNIC/B-Form", async () => {
    const res = await request(createApp()).post("/api/v1/auth/login").send({ identifier: `CNIC-STU-LOGIN-${suffix}`, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(studentUserId);
  });

  it("logs in a parent with their CNIC (family has no email)", async () => {
    const res = await request(createApp()).post("/api/v1/auth/login").send({ identifier: `CNIC-PARENT-LOGIN-${suffix}`, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(parentUserId);
  });

  it("refuses an identifier that matches nothing, with the same generic message as a wrong password", async () => {
    const res = await request(createApp()).post("/api/v1/auth/login").send({ identifier: "no-such-identifier-at-all", password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_CREDENTIALS");
  });
});
