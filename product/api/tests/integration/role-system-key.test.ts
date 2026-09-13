import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, createTestUserWithRole, loginAsTestUser, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Phase 12 Gap 2 — the design doc's own required verification: "rename a
// system role's name, confirm authorization behavior is unchanged." This
// is the whole point of Role.systemKey — CAMPUS_HEAD's campus-scoping
// behavior must survive a display-name rename completely untouched.
//
// CAMPUS_HEAD is a real, shared, singleton row (not a per-test fixture) —
// several other test files (delegations.test.ts, staff-attendance.test.ts)
// look it up by `name: "CAMPUS_HEAD"`. The rename here MUST be reverted
// unconditionally, or every test file that runs after this one breaks.
// try/finally around the rename (not just afterAll) guarantees that even
// if an assertion throws mid-test.

const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let campusHeadRoleId: string;
let originalCampusHeadName: string;
let campusId: string;
let campusHeadUserId: string;

describe("Role.systemKey survives a role rename (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [campusHeadRole, campus] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { systemKey: "CAMPUS_HEAD" } }),
      prisma.campus.create({ data: { name: `SystemKey-Test Campus ${suffix}`, instituteId: institute.id } }),
    ]);
    campusHeadRoleId = campusHeadRole.id;
    originalCampusHeadName = campusHeadRole.name;
    campusId = campus.id;

    const campusHeadUser = await createTestUserWithRole({
      email: `systemkey-campushead-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "SystemKey Test Campus Head",
      roleName: "CAMPUS_HEAD",
    });
    campusHeadUserId = campusHeadUser.id;
    await prisma.userRole.updateMany({ where: { userId: campusHeadUserId, roleId: campusHeadRoleId }, data: { campusId } });
  }, 60000);

  afterAll(async () => {
    // Safety net in case the `it` block's own finally somehow didn't run
    // (e.g. the process was killed mid-test) — never leave the real
    // CAMPUS_HEAD role renamed.
    await prisma.role.update({ where: { id: campusHeadRoleId }, data: { name: originalCampusHeadName } }).catch(() => {});
    if (campusHeadUserId) await prisma.user.deleteMany({ where: { id: campusHeadUserId } }).catch(() => {});
    if (campusId) await prisma.campus.deleteMany({ where: { id: campusId } }).catch(() => {});
  });

  // More sequential round trips than this suite's typical test (login,
  // 2x delegations GET, a role rename, a campus create+delete) — needs
  // more than the file's global 20s testTimeout on real Neon latency, same
  // documented class of flakiness as homework.test.ts's multi-attachment
  // test earlier this session. Passes well within 20s on local Postgres.
  it("keeps Campus Head's campus-scoped authorization identical before and after renaming the role's display label", async () => {
    const campusHeadClient = await loginAsTestUser(`systemkey-campushead-${suffix}@example.test`, PASSWORD);

    // Before rename: Campus Head can see their own campus (assertCampusInScope
    // succeeds — proven via the delegations list endpoint, which is
    // Campus-Head-permissioned and campus-scoped).
    const before = await campusHeadClient.get(`/api/v1/delegations?campusId=${campusId}`);
    expect(before.status).toBe(200);

    const newName = `Director ${suffix}`;
    try {
      const renameRes = await asSuperAdmin().patch(`/api/v1/roles/${campusHeadRoleId}`).send({ name: newName });
      expect(renameRes.status).toBe(200);
      expect(renameRes.body.name).toBe(newName);
      expect(renameRes.body.systemKey).toBe("CAMPUS_HEAD");

      // After rename: the exact same user, same session, same UserRole row
      // (unchanged roleId) — authorization must behave identically, since
      // it now reads systemKey, never name.
      const after = await campusHeadClient.get(`/api/v1/delegations?campusId=${campusId}`);
      expect(after.status).toBe(200);

      // A campus this actor does NOT belong to is still refused exactly as
      // before the rename — proves scope.ts's CAMPUS_ASSIGNED_ROLES check
      // (keyed on systemKey) still recognizes this now-renamed role.
      const otherCampus = await prisma.campus.create({ data: { name: `SystemKey-Test Other ${suffix}`, instituteId: (await prisma.institute.findFirstOrThrow()).id } });
      const refused = await campusHeadClient.get(`/api/v1/delegations?campusId=${otherCampus.id}`);
      expect(refused.status).toBe(403);
      await prisma.campus.delete({ where: { id: otherCampus.id } }).catch(() => {});
    } finally {
      await prisma.role.update({ where: { id: campusHeadRoleId }, data: { name: originalCampusHeadName } });
    }
  }, 40000);

  it("re-running the seed script after a rename finds the same role by systemKey, not a duplicate", async () => {
    const newName = `Director ${suffix}`;
    try {
      await prisma.role.update({ where: { id: campusHeadRoleId }, data: { name: newName } });

      // Mirrors exactly what `prisma/seed.ts`'s upsert does.
      const found = await prisma.role.upsert({
        where: { systemKey: "CAMPUS_HEAD" },
        update: {},
        create: { name: "CAMPUS_HEAD", systemKey: "CAMPUS_HEAD", isSystem: true },
      });
      expect(found.id).toBe(campusHeadRoleId);
      expect(found.name).toBe(newName); // untouched by the upsert's `update: {}`

      const totalCampusHeadRows = await prisma.role.count({ where: { systemKey: "CAMPUS_HEAD" } });
      expect(totalCampusHeadRows).toBe(1);
    } finally {
      await prisma.role.update({ where: { id: campusHeadRoleId }, data: { name: originalCampusHeadName } });
    }
  });
});
