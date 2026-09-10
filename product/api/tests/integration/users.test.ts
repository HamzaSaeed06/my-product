import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const testEmail = `test-user-${suffix}@example.test`;
let createdUserId: string | undefined;

describe("Users API (real database)", () => {
  afterAll(async () => {
    if (createdUserId) {
      await prisma.userRole.deleteMany({ where: { userId: createdUserId } });
      await prisma.session.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  it("creates a user", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/users")
      .send({ email: testEmail, password: "Str0ng!Passw0rd", fullName: "Test User" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(testEmail);
    expect(res.body.isActive).toBe(true);
    createdUserId = res.body.id;
  });

  it("rejects creating the same email twice", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/users")
      .send({ email: testEmail, password: "Str0ng!Passw0rd", fullName: "Dup" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("EMAIL_IN_USE");
  });

  it("rejects a weak password", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/users")
      .send({ email: `weak-${suffix}@example.test`, password: "weak", fullName: "Weak" });

    expect(res.status).toBe(400);
  });

  it("edits the user's full name", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/users/${createdUserId}`)
      .send({ fullName: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe("Updated Name");
  });

  it("assigns and removes a role, and both actions revoke sessions", async () => {
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: "TEACHER" } });

    // Give the test user an active session, then confirm it dies on role change.
    const session = await prisma.session.create({
      data: {
        userId: createdUserId!,
        refreshTokenHash: "irrelevant-for-this-test",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const assignRes = await asSuperAdmin()
      .post(`/api/v1/users/${createdUserId}/roles`)
      .send({ roleId: teacherRole.id });
    expect(assignRes.status).toBe(201);

    const sessionAfterAssign = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(sessionAfterAssign.revokedAt).not.toBeNull();

    const removeRes = await asSuperAdmin().delete(
      `/api/v1/users/${createdUserId}/roles/${assignRes.body.id}`
    );
    expect(removeRes.status).toBe(204);
  });

  it("disables the user and revokes their sessions", async () => {
    const session = await prisma.session.create({
      data: {
        userId: createdUserId!,
        refreshTokenHash: "irrelevant-for-this-test-2",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const res = await asSuperAdmin()
      .post(`/api/v1/users/${createdUserId}/active`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);

    const sessionAfter = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(sessionAfter.revokedAt).not.toBeNull();
  });

  it("writes audit log entries for create/update/disable", async () => {
    const logs = await prisma.auditLog.findMany({
      where: { resource: "User", recordId: createdUserId },
      orderBy: { createdAt: "asc" },
    });

    const actions = logs.map((l) => l.action);
    expect(actions).toContain("CREATE");
    expect(actions).toContain("UPDATE");
    expect(actions).toContain("DISABLE");
  });
});
