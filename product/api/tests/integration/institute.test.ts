import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Institute is a real singleton bootstrapped via `npm run create-institute`
// (see scripts/create-institute.ts) — these tests read/update it, they
// never create or delete it.
describe("Institute API (real database, singleton)", () => {
  let originalName: string;

  afterAll(async () => {
    // Restore the name in case a test run changed it, so re-running tests
    // (or a human poking at the same dev DB) sees a stable value.
    const institute = await prisma.institute.findFirst();
    if (institute && originalName) {
      await prisma.institute.update({ where: { id: institute.id }, data: { name: originalName } });
    }
  });

  it("returns the configured institute", async () => {
    const res = await asSuperAdmin().get("/api/v1/institute");
    expect(res.status).toBe(200);
    expect(res.body.name).toBeTruthy();
    expect(res.body.settings).toBeTruthy();
    originalName = res.body.name;
  });

  it("refuses to create a second institute (singleton)", async () => {
    const res = await asSuperAdmin().post("/api/v1/institute").send({ name: "Another Institute" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INSTITUTE_ALREADY_EXISTS");
  });

  it("updates the institute profile", async () => {
    const res = await asSuperAdmin().patch("/api/v1/institute").send({ name: "Updated Test Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Test Name");
  });

  it("updates institute settings (terminology)", async () => {
    const res = await asSuperAdmin()
      .patch("/api/v1/institute/settings")
      .send({ studentLabel: "Learner", currency: "PKR" });
    expect(res.status).toBe(200);
    expect(res.body.studentLabel).toBe("Learner");
    expect(res.body.currency).toBe("PKR");
  });

  it("logs audit entries for profile and settings updates", async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const profileLog = await prisma.auditLog.findFirst({
      where: { resource: "Institute", recordId: institute.id, action: "UPDATE" },
    });
    const settingsLog = await prisma.auditLog.findFirst({
      where: { resource: "InstituteSettings", action: "UPDATE" },
    });
    expect(profileLog).not.toBeNull();
    expect(settingsLog).not.toBeNull();
  });
});
