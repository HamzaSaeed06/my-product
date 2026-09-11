import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let instituteId: string;
let categoryId: string;

describe("Fee Categories API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    instituteId = institute.id;
  });

  afterAll(async () => {
    await prisma.feeCategory.deleteMany({ where: { id: categoryId } });
  });

  it("creates a fee category", async () => {
    const res = await asSuperAdmin().post("/api/v1/fee-categories").send({ instituteId, name: `Tuition ${suffix}` });
    expect(res.status).toBe(201);
    categoryId = res.body.id;
  });

  it("refuses a duplicate fee category name", async () => {
    const res = await asSuperAdmin().post("/api/v1/fee-categories").send({ instituteId, name: `Tuition ${suffix}` });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("FEE_CATEGORY_EXISTS");
  });

  it("lists fee categories", async () => {
    const res = await asSuperAdmin().get("/api/v1/fee-categories");
    expect(res.status).toBe(200);
    expect(res.body.some((c: { id: string }) => c.id === categoryId)).toBe(true);
  });

  it("archives the fee category", async () => {
    const res = await asSuperAdmin().post(`/api/v1/fee-categories/${categoryId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });

  it("refuses archiving twice", async () => {
    const res = await asSuperAdmin().post(`/api/v1/fee-categories/${categoryId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_ARCHIVED");
  });
});
