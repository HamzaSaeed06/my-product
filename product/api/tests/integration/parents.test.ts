import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const phone = `555-${suffix}`;
let parentId: string | undefined;
let studentId: string;
let linkId: string | undefined;

describe("Parents API (real database)", () => {
  beforeAll(async () => {
    const student = await prisma.student.create({
      data: { studentCode: `STU-TEST-${suffix}`, fullName: `Parent-Test Child ${suffix}` },
    });
    studentId = student.id;
  });

  afterAll(async () => {
    if (parentId) {
      await prisma.studentParent.deleteMany({ where: { parentId } });
      await prisma.parent.delete({ where: { id: parentId } }).catch(() => {});
    }
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
  });

  it("creates a parent", async () => {
    const res = await asSuperAdmin().post("/api/v1/parents").send({ fullName: `Test Parent ${suffix}`, phone });
    expect(res.status).toBe(201);
    parentId = res.body.id;
  });

  it("finds the parent via phone search (duplicate check)", async () => {
    const res = await asSuperAdmin().get(`/api/v1/parents/search?phone=${encodeURIComponent(phone)}`);
    expect(res.status).toBe(200);
    expect(res.body.some((p: { id: string }) => p.id === parentId)).toBe(true);
  });

  it("links a child to the parent", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/parents/${parentId}/children`)
      .send({ studentId, relationship: "Father", isPrimary: true });
    expect(res.status).toBe(201);
    linkId = res.body.id;
  });

  it("refuses to link the same child twice", async () => {
    const res = await asSuperAdmin().post(`/api/v1/parents/${parentId}/children`).send({ studentId });
    expect(res.status).toBe(409);
  });

  it("shows the linked child in the parent list", async () => {
    const res = await asSuperAdmin().get("/api/v1/parents");
    expect(res.status).toBe(200);
    const found = res.body.find((p: { id: string }) => p.id === parentId);
    expect(found.children).toHaveLength(1);
    expect(found.children[0].student.id).toBe(studentId);
  });

  it("unlinks the child", async () => {
    const res = await asSuperAdmin().delete(`/api/v1/parents/${parentId}/children/${linkId}`);
    expect(res.status).toBe(204);
  });
});
