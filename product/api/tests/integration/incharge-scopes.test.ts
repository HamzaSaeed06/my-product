import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { checkInchargeScope } from "../../src/modules/incharge-scopes/service.js";
import { hashPassword } from "../../src/lib/password.js";

const suffix = uniqueSuffix();
let inchargeUserId: string;
let nonInchargeUserId: string;
let campusId: string;
let academicYearId: string;
let classAId: string;
let classBId: string;
let scopeId: string | undefined;

describe("Incharge Scopes API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const inchargeRole = await prisma.role.findUniqueOrThrow({ where: { name: "INCHARGE" } });
    const passwordHash = await hashPassword("Str0ng!Passw0rd");

    const [inchargeUser, nonInchargeUser, campus, year, classA, classB] = await Promise.all([
      prisma.user.create({
        data: {
          email: `incharge-${suffix}@example.test`,
          passwordHash,
          fullName: "Test Incharge",
          userRoles: { create: { roleId: inchargeRole.id } },
        },
      }),
      prisma.user.create({
        data: { email: `not-incharge-${suffix}@example.test`, passwordHash, fullName: "Not Incharge" },
      }),
      prisma.campus.create({ data: { name: `Scope-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: {
          name: `Scope-Test-Year-${suffix}`,
          startDate: new Date("2026-08-01"),
          endDate: new Date("2027-07-31"),
          instituteId: institute.id,
        },
      }),
      prisma.class.create({ data: { name: `Scope-Test Class A ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Scope-Test Class B ${suffix}`, instituteId: institute.id } }),
    ]);

    inchargeUserId = inchargeUser.id;
    nonInchargeUserId = nonInchargeUser.id;
    campusId = campus.id;
    academicYearId = year.id;
    classAId = classA.id;
    classBId = classB.id;
  });

  afterAll(async () => {
    if (scopeId) {
      await prisma.inchargeScopeClass.deleteMany({ where: { inchargeScopeId: scopeId } });
      await prisma.inchargeScopeSection.deleteMany({ where: { inchargeScopeId: scopeId } });
      await prisma.inchargeScope.delete({ where: { id: scopeId } }).catch(() => {});
    }
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.deleteMany({ where: { id: { in: [classAId, classBId] } } });
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [inchargeUserId, nonInchargeUserId] } } });
  });

  it("refuses to assign a scope to a user without the INCHARGE role", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/incharge-scopes")
      .send({ userId: nonInchargeUserId, campusId, academicYearId, classIds: [classAId] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("USER_NOT_INCHARGE");
  });

  it("creates a scope covering only Class A", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/incharge-scopes")
      .send({ userId: inchargeUserId, campusId, academicYearId, classIds: [classAId] });
    expect(res.status).toBe(201);
    expect(res.body.version).toBe(0);
    expect(res.body.classes).toHaveLength(1);
    scopeId = res.body.id;
  });

  it("ALLOWs a scope check for the assigned class", async () => {
    const allowed = await checkInchargeScope({
      userId: inchargeUserId,
      campusId,
      academicYearId,
      classId: classAId,
    });
    expect(allowed).toBe(true);
  });

  it("DENYs a scope check for an unassigned class", async () => {
    const allowed = await checkInchargeScope({
      userId: inchargeUserId,
      campusId,
      academicYearId,
      classId: classBId,
    });
    expect(allowed).toBe(false);
  });

  it("rejects an update with a stale version (optimistic concurrency)", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/incharge-scopes/${scopeId}`)
      .send({ classIds: [classAId, classBId], expectedVersion: 999 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("VERSION_CONFLICT");
  });

  it("expands the scope to Class A and B with the correct version", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/incharge-scopes/${scopeId}`)
      .send({ classIds: [classAId, classBId], expectedVersion: 0 });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.classes).toHaveLength(2);
  });

  it("now ALLOWs a scope check for the newly-added class", async () => {
    const allowed = await checkInchargeScope({
      userId: inchargeUserId,
      campusId,
      academicYearId,
      classId: classBId,
    });
    expect(allowed).toBe(true);
  });

  it("revokes the scope, after which checks DENY", async () => {
    const res = await asSuperAdmin().post(`/api/v1/incharge-scopes/${scopeId}/revoke`);
    expect(res.status).toBe(200);
    expect(res.body.revokedAt).not.toBeNull();

    const allowed = await checkInchargeScope({ userId: inchargeUserId, campusId, academicYearId, classId: classAId });
    expect(allowed).toBe(false);
  });

  it("refuses to revoke an already-revoked scope", async () => {
    const res = await asSuperAdmin().post(`/api/v1/incharge-scopes/${scopeId}/revoke`);
    expect(res.status).toBe(409);
  });
});
