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
let validSectionId: string;
let wrongCampusSectionId: string;
let otherCampusId: string;
let scopeId: string | undefined;

describe("Incharge Scopes API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const inchargeRole = await prisma.role.findUniqueOrThrow({ where: { name: "INCHARGE" } });
    const passwordHash = await hashPassword("Str0ng!Passw0rd");

    const [inchargeUser, nonInchargeUser, campus, otherCampus, year, classA, classB] = await Promise.all([
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
      prisma.campus.create({ data: { name: `Scope-Test Other Campus ${suffix}`, instituteId: institute.id } }),
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
    otherCampusId = otherCampus.id;
    academicYearId = year.id;
    classAId = classA.id;
    classBId = classB.id;

    const [validSection, wrongCampusSection] = await Promise.all([
      prisma.section.create({
        data: { classId: classAId, campusId, academicYearId, name: "A" },
      }),
      prisma.section.create({
        data: { classId: classAId, campusId: otherCampusId, academicYearId, name: "A" },
      }),
    ]);
    validSectionId = validSection.id;
    wrongCampusSectionId = wrongCampusSection.id;
  });

  afterAll(async () => {
    if (scopeId) {
      await prisma.inchargeScopeClass.deleteMany({ where: { inchargeScopeId: scopeId } });
      await prisma.inchargeScopeSection.deleteMany({ where: { inchargeScopeId: scopeId } });
      await prisma.inchargeScope.delete({ where: { id: scopeId } }).catch(() => {});
    }
    await prisma.section.deleteMany({ where: { id: { in: [validSectionId, wrongCampusSectionId] } } });
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.deleteMany({ where: { id: { in: [classAId, classBId] } } });
    await prisma.campus.deleteMany({ where: { id: { in: [campusId, otherCampusId] } } });
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

  it("rejects a sectionId from a different campus (scope mismatch)", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/incharge-scopes")
      .send({
        userId: inchargeUserId,
        campusId,
        academicYearId,
        classIds: [classAId],
        sectionIds: [wrongCampusSectionId],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("SECTION_SCOPE_MISMATCH");
  });

  it("accepts a sectionId that matches campus/year/class via update", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/incharge-scopes/${scopeId}`)
      .send({ sectionIds: [validSectionId], expectedVersion: 0 });
    expect(res.status).toBe(200);
    expect(res.body.sections).toHaveLength(1);
  });

  it("rejects an update with a stale version (optimistic concurrency)", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/incharge-scopes/${scopeId}`)
      .send({ classIds: [classAId, classBId], expectedVersion: 999 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("VERSION_CONFLICT");
  });

  it("expands the scope to Class A and B with the correct version", async () => {
    // Version is 1 here, not 0 — the "accepts a sectionId..." test above
    // already consumed version 0 with its own successful update.
    const res = await asSuperAdmin()
      .patch(`/api/v1/incharge-scopes/${scopeId}`)
      .send({ classIds: [classAId, classBId], expectedVersion: 1 });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
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
