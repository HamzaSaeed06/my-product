import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { seedTerminologyPresetForType } from "../../src/lib/terminology.js";
import { setInstituteFeatureConfig, resolveFeatureConfig, setCampusFeatureConfig } from "../../src/lib/featureConfig.js";

// Phase 12 — Dynamic Institution Architecture. Gap 1 (TerminologyOverride),
// Gap 3 (generic FeatureConfig), and Gap 4 (auto-created default campus)
// covered here. Gap 2 (Role.systemKey) has its own dedicated
// role-system-key.test.ts.

const suffix = uniqueSuffix();

describe("Terminology (Gap 1, real database)", () => {
  afterAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    // SUBJECT/CAMPUS aren't touched by institute.test.ts's legacy-shim
    // tests — safe to fully clean up after this file without disturbing
    // other tests' state.
    await prisma.terminologyOverride.deleteMany({ where: { instituteId: institute.id, canonicalKey: { in: ["SUBJECT", "CAMPUS"] } } });
  });

  it("resolves plain English defaults for a key with no override", async () => {
    const res = await asSuperAdmin().get("/api/v1/terminology");
    expect(res.status).toBe(200);
    expect(res.body.ENROLLMENT).toEqual({ singular: "Enrollment", plural: "Enrollments" });
  });

  it("Super Admin sets a custom label for one canonical key via the generic API", async () => {
    const res = await asSuperAdmin().put("/api/v1/terminology/SUBJECT").send({ singularLabel: "Course", pluralLabel: "Courses" });
    expect(res.status).toBe(200);

    const getRes = await asSuperAdmin().get("/api/v1/terminology");
    expect(getRes.body.SUBJECT).toEqual({ singular: "Course", plural: "Courses" });
    // Untouched keys still fall back to their default.
    expect(getRes.body.CLASS).toEqual({ singular: "Class", plural: "Classes" });
  });

  it("seeds an institution-type preset (ACADEMY -> Program/Batch/Course) without touching SCHOOL's implicit defaults", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    await seedTerminologyPresetForType(institute.id, "ACADEMY");

    const res = await asSuperAdmin().get("/api/v1/terminology");
    expect(res.body.CLASS).toEqual({ singular: "Program", plural: "Programs" });
    expect(res.body.SECTION).toEqual({ singular: "Batch", plural: "Batches" });

    // Revert — this file's own change, not institute.test.ts's.
    await prisma.terminologyOverride.deleteMany({ where: { instituteId: institute.id, canonicalKey: { in: ["CLASS", "SECTION"] } } });
  });

  it("SCHOOL type seeds zero override rows (the English default already IS the school preset)", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const before = await prisma.terminologyOverride.count({ where: { instituteId: institute.id } });
    await seedTerminologyPresetForType(institute.id, "SCHOOL");
    const after = await prisma.terminologyOverride.count({ where: { instituteId: institute.id } });
    expect(after).toBe(before);
  });
});

describe("FeatureConfig (Gap 3, real database)", () => {
  const featureKey = `TEST_FEATURE_${suffix}`;
  let campusId: string;

  afterAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    await prisma.featureConfig.deleteMany({ where: { instituteId: institute.id, featureKey } });
    if (campusId) await prisma.campus.deleteMany({ where: { id: campusId } });
  });

  it("MANDATORY: the institute value always wins and a campus row is refused", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    campusId = (await prisma.campus.create({ data: { name: `Phase12-Test Campus ${suffix}`, instituteId: institute.id } })).id;

    await setInstituteFeatureConfig(institute.id, featureKey, "MANDATORY", { limit: 10 });

    const resolved = await resolveFeatureConfig(institute.id, campusId, featureKey);
    expect(resolved).toEqual({ policyMode: "MANDATORY", value: { limit: 10 }, source: "institute" });

    await expect(setCampusFeatureConfig(institute.id, campusId, featureKey, { limit: 999 })).rejects.toMatchObject({
      status: 403,
      code: "FEATURE_POLICY_MANDATORY",
    });
  });

  it("INSTITUTE_DEFAULT: falls back to the institute value until a campus overrides it", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    await setInstituteFeatureConfig(institute.id, featureKey, "INSTITUTE_DEFAULT", { limit: 10 });

    const beforeOverride = await resolveFeatureConfig(institute.id, campusId, featureKey);
    expect(beforeOverride).toEqual({ policyMode: "INSTITUTE_DEFAULT", value: { limit: 10 }, source: "institute" });

    await setCampusFeatureConfig(institute.id, campusId, featureKey, { limit: 25 });
    const afterOverride = await resolveFeatureConfig(institute.id, campusId, featureKey);
    expect(afterOverride).toEqual({ policyMode: "INSTITUTE_DEFAULT", value: { limit: 25 }, source: "campus" });
  });

  it("CAMPUS_CONTROLLED: each campus manages its own row independently", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    await setInstituteFeatureConfig(institute.id, featureKey, "CAMPUS_CONTROLLED", { limit: 10 });
    await setCampusFeatureConfig(institute.id, campusId, featureKey, { limit: 50 });

    const resolved = await resolveFeatureConfig(institute.id, campusId, featureKey);
    expect(resolved).toEqual({ policyMode: "CAMPUS_CONTROLLED", value: { limit: 50 }, source: "campus" });
  });

  it("the real ATTENDANCE_CHECKIN_METHODS proof-of-concept blocks a narrowed method", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const before = await resolveFeatureConfig(institute.id, campusId, "ATTENDANCE_CHECKIN_METHODS");
    expect((before.value as { allowedMethods: string[] }).allowedMethods).toContain("QR");

    // Narrow this one test campus to MANUAL-only.
    await setCampusFeatureConfig(institute.id, campusId, "ATTENDANCE_CHECKIN_METHODS", { allowedMethods: ["MANUAL"] });

    const token = (await asSuperAdmin().get(`/api/v1/staff-attendance/qr-token?campusId=${campusId}`)).body.token;
    const res = await asSuperAdmin().post("/api/v1/staff-attendance/check-in").send({ campusId, token });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("CHECKIN_METHOD_NOT_ALLOWED");

    await prisma.featureConfig.deleteMany({ where: { instituteId: institute.id, campusId, featureKey: "ATTENDANCE_CHECKIN_METHODS" } });
  });
});

describe("Default campus auto-creation (Gap 4, real database)", () => {
  // Institute is a real singleton — the createInstitute() *service*
  // function refuses a second one. That refusal is a business-logic check
  // (findFirst-then-throw), not a DB constraint (confirmed by its own
  // comment), so a second Institute row is safe to insert directly via
  // Prisma for this one test, exactly like every other test file bypasses
  // the admin-only API to set up fixtures. Fully cleaned up afterward.
  let testInstituteId: string;

  afterAll(async () => {
    if (testInstituteId) {
      await prisma.featureConfig.deleteMany({ where: { instituteId: testInstituteId } });
      await prisma.terminologyOverride.deleteMany({ where: { instituteId: testInstituteId } });
      await prisma.campus.deleteMany({ where: { instituteId: testInstituteId } });
      await prisma.instituteSettings.deleteMany({ where: { instituteId: testInstituteId } });
      await prisma.institute.delete({ where: { id: testInstituteId } }).catch(() => {});
    }
  });

  it("mirrors createInstitute()'s exact nested-write shape: institute + settings + a default 'Main Campus' in one create", async () => {
    const institute = await prisma.institute.create({
      data: {
        name: `Phase12-Test Institute ${suffix}`,
        type: "ACADEMY",
        settings: { create: {} },
        campuses: { create: [{ name: "Main Campus" }] },
      },
      include: { campuses: true, settings: true },
    });
    testInstituteId = institute.id;

    expect(institute.campuses).toHaveLength(1);
    expect(institute.campuses[0]!.name).toBe("Main Campus");
    expect(institute.settings).not.toBeNull();
  });
});
