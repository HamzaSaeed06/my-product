import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const roleName = `TEST_ROLE_${suffix.toUpperCase()}`;
let createdRoleId: string | undefined;

describe("Roles & Permissions API (real database)", () => {
  afterAll(async () => {
    if (createdRoleId) {
      await prisma.rolePermission.deleteMany({ where: { roleId: createdRoleId } });
      await prisma.role.delete({ where: { id: createdRoleId } }).catch(() => {});
    }
  });

  it("lists the permission catalog", async () => {
    const res = await asSuperAdmin().get("/api/v1/permissions");
    expect(res.status).toBe(200);
    expect(res.body.some((p: { key: string }) => p.key === "user.view")).toBe(true);
  });

  it("creates a custom role", async () => {
    const res = await asSuperAdmin().post("/api/v1/roles").send({ name: roleName, description: "test" });
    expect(res.status).toBe(201);
    expect(res.body.isSystem).toBe(false);
    createdRoleId = res.body.id;
  });

  it("rejects a duplicate role name", async () => {
    const res = await asSuperAdmin().post("/api/v1/roles").send({ name: "SUPER_ADMIN" });
    expect(res.status).toBe(409);
  });

  it("sets and diffs the role's permissions", async () => {
    const res = await asSuperAdmin()
      .put(`/api/v1/roles/${createdRoleId}/permissions`)
      .send({ permissionKeys: ["user.view", "audit.view"] });

    expect(res.status).toBe(200);
    expect(res.body.permissionKeys.sort()).toEqual(["audit.view", "user.view"]);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { resource: "RolePermission", recordId: createdRoleId },
      orderBy: { createdAt: "desc" },
    });
    expect((auditEntry?.newValue as { permissions: string[] })?.permissions.sort()).toEqual([
      "audit.view",
      "user.view",
    ]);
  });

  it("rejects unknown permission keys", async () => {
    const res = await asSuperAdmin()
      .put(`/api/v1/roles/${createdRoleId}/permissions`)
      .send({ permissionKeys: ["not.a.real.permission"] });

    expect(res.status).toBe(400);
  });

  it("refuses to archive a system role", async () => {
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
    const res = await asSuperAdmin().post(`/api/v1/roles/${superAdminRole.id}/archive`);
    expect(res.status).toBe(403);
  });

  it("archives the custom role once nothing uses it", async () => {
    const res = await asSuperAdmin().post(`/api/v1/roles/${createdRoleId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });

  it("refuses to edit an archived role", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/roles/${createdRoleId}`)
      .send({ description: "should fail" });
    expect(res.status).toBe(409);
  });
});
