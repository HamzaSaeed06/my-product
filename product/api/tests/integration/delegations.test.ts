import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUserWithRole, loginAsTestUser, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Phase 11 Phase A2 — a general, time-boxed grant of one role's
// permissions (scoped to one campus) to another user. Verifies the full
// live-computed chain: authorize.ts's permission union, scope.ts's campus
// widening, and audit.ts's automatic "acting via delegation" tagging —
// none of which the delegation module's own code touches directly.

const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let campusId: string;
let otherCampusId: string;
let officeRoleId: string;
let superAdminRoleId: string;
let campusHeadRoleId: string;

let campusHeadUserId: string;
let campusHeadClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let teacherUserId: string;
let teacherId: string;
let teacherClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let delegationId: string;
let inquiryId: string;

describe("Delegations API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [campus, otherCampus, officeRole, superAdminRole, campusHeadRole] = await Promise.all([
      prisma.campus.create({ data: { name: `Delegation-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.campus.create({ data: { name: `Delegation-Test Other Campus ${suffix}`, instituteId: institute.id } }),
      prisma.role.findUniqueOrThrow({ where: { name: "OFFICE" } }),
      prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } }),
      prisma.role.findUniqueOrThrow({ where: { name: "CAMPUS_HEAD" } }),
    ]);
    campusId = campus.id;
    otherCampusId = otherCampus.id;
    officeRoleId = officeRole.id;
    superAdminRoleId = superAdminRole.id;
    campusHeadRoleId = campusHeadRole.id;

    const campusHeadUser = await createTestUserWithRole({
      email: `deleg-campushead-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Delegation Test Campus Head",
      roleName: "CAMPUS_HEAD",
    });
    campusHeadUserId = campusHeadUser.id;
    // createTestUserWithRole doesn't set campusId — Campus Head's own
    // campus scope comes from UserRole.campusId (see scope.ts), so this
    // fixture needs it set directly.
    await prisma.userRole.updateMany({ where: { userId: campusHeadUserId, roleId: campusHeadRoleId }, data: { campusId } });
    campusHeadClient = await loginAsTestUser(campusHeadUser.email, PASSWORD);

    const teacherUser = await createTestUserWithRole({
      email: `deleg-teacher-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Delegation Test Teacher",
      roleName: "TEACHER",
    });
    teacherUserId = teacherUser.id;
    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;
    teacherClient = await loginAsTestUser(teacherUser.email, PASSWORD);
  }, 60000);

  afterAll(async () => {
    if (inquiryId) await prisma.admissionInquiry.deleteMany({ where: { id: inquiryId } }).catch(() => {});
    if (delegationId) await prisma.delegation.deleteMany({ where: { id: delegationId } }).catch(() => {});
    if (teacherId) await prisma.teacher.deleteMany({ where: { id: teacherId } }).catch(() => {});
    if (teacherUserId) await prisma.user.deleteMany({ where: { id: teacherUserId } }).catch(() => {});
    if (campusHeadUserId) await prisma.user.deleteMany({ where: { id: campusHeadUserId } }).catch(() => {});
    if (campusId || otherCampusId) {
      await prisma.campus.deleteMany({ where: { id: { in: [campusId, otherCampusId].filter(Boolean) } } }).catch(() => {});
    }
  });

  it("a Teacher cannot create an admission inquiry before any delegation exists", async () => {
    const res = await teacherClient
      .post("/api/v1/admission-inquiries")
      .send({ campusId, childName: "No Delegation Yet", parentName: "Parent", parentPhone: "03001234567" });
    expect(res.status).toBe(403);
  });

  it("refuses a Campus Head delegating a campus that isn't their own", async () => {
    const res = await campusHeadClient.post("/api/v1/delegations").send({
      delegateToUserId: teacherUserId,
      roleId: officeRoleId,
      campusId: otherCampusId,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      reason: "Covering for Office",
    });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("OUT_OF_SCOPE");
  });

  it("refuses delegating the SUPER_ADMIN role", async () => {
    const res = await campusHeadClient.post("/api/v1/delegations").send({
      delegateToUserId: teacherUserId,
      roleId: superAdminRoleId,
      campusId,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      reason: "Should be refused",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("CANNOT_DELEGATE_SUPER_ADMIN");
  });

  it("Campus Head delegates the OFFICE role to a Teacher for their own campus", async () => {
    const res = await campusHeadClient.post("/api/v1/delegations").send({
      delegateToUserId: teacherUserId,
      roleId: officeRoleId,
      campusId,
      validFrom: new Date(Date.now() - 60000).toISOString(),
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      reason: "Covering for Office while Office is on leave",
    });
    expect(res.status).toBe(201);
    expect(res.body.role.name).toBe("OFFICE");
    delegationId = res.body.id;
  });

  it("the Teacher's own /delegations/mine now shows the active delegation", async () => {
    const res = await teacherClient.get("/api/v1/delegations/mine");
    expect(res.status).toBe(200);
    expect(res.body.some((d: { id: string }) => d.id === delegationId)).toBe(true);
  });

  it("the Teacher can now create an admission inquiry for that campus via the delegated OFFICE permission", async () => {
    const res = await teacherClient
      .post("/api/v1/admission-inquiries")
      .send({ campusId, childName: "Via Delegation", parentName: "Parent", parentPhone: "03001234567" });
    expect(res.status).toBe(201);
    inquiryId = res.body.id;
  });

  it("the resulting audit log is tagged with the active delegation", async () => {
    const log = await prisma.auditLog.findFirst({
      where: { resource: "AdmissionInquiry", recordId: inquiryId, action: "CREATE" },
      orderBy: { createdAt: "desc" },
    });
    expect(log?.viaDelegationId).toBe(delegationId);
  });

  it("the Teacher still cannot create an inquiry for a campus outside the delegation", async () => {
    const res = await teacherClient
      .post("/api/v1/admission-inquiries")
      .send({ campusId: otherCampusId, childName: "Outside Delegation", parentName: "Parent", parentPhone: "03001234567" });
    expect(res.status).toBe(403);
  });

  it("Campus Head revokes the delegation", async () => {
    const res = await campusHeadClient.post(`/api/v1/delegations/${delegationId}/revoke`);
    expect(res.status).toBe(200);
    expect(res.body.revokedAt).not.toBeNull();
  });

  it("the Teacher immediately loses the delegated permission again", async () => {
    const res = await teacherClient
      .post("/api/v1/admission-inquiries")
      .send({ campusId, childName: "After Revoke", parentName: "Parent", parentPhone: "03001234567" });
    expect(res.status).toBe(403);
  });

  it("refuses revoking an already-revoked delegation", async () => {
    const res = await campusHeadClient.post(`/api/v1/delegations/${delegationId}/revoke`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_REVOKED");
  });
});
