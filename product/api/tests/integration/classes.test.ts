import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const className = `Test Class ${suffix}`;
let classId: string | undefined;

describe("Classes API (real database)", () => {
  afterAll(async () => {
    if (classId) {
      await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    }
  });

  it("creates a class", async () => {
    const res = await asSuperAdmin().post("/api/v1/classes").send({ name: className, sortOrder: 999 });
    expect(res.status).toBe(201);
    classId = res.body.id;
  });

  it("rejects a duplicate class name", async () => {
    const res = await asSuperAdmin().post("/api/v1/classes").send({ name: className });
    expect(res.status).toBe(409);
  });

  it("updates the class", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/classes/${classId}`).send({ sortOrder: 5 });
    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(5);
  });

  it("archives the class (no active sections)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/classes/${classId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });
});
