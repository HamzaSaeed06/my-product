import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let studentId: string;
let discountId: string;

describe("Discounts API (real database)", () => {
  beforeAll(async () => {
    const student = await prisma.student.create({ data: { studentCode: `STU-DISC-${suffix}`, fullName: `Discount Test ${suffix}` } });
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.discount.deleteMany({ where: { studentId } });
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
  });

  it("refuses providing both amount and percentage", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/discounts")
      .send({ studentId, type: "SIBLING", amount: "500.00", percentage: "10.00", reason: "Sibling enrolled" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("AMOUNT_OR_PERCENTAGE");
  });

  it("refuses providing neither amount nor percentage", async () => {
    const res = await asSuperAdmin().post("/api/v1/discounts").send({ studentId, type: "MERIT", reason: "Top scorer" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("AMOUNT_OR_PERCENTAGE");
  });

  it("creates a discount request", async () => {
    const res = await asSuperAdmin().post("/api/v1/discounts").send({ studentId, type: "MERIT", percentage: "15.00", reason: "Top scorer" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    discountId = res.body.id;
  });

  it("lists discounts filtered by student", async () => {
    const res = await asSuperAdmin().get(`/api/v1/discounts?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("approves the discount", async () => {
    const res = await asSuperAdmin().post(`/api/v1/discounts/${discountId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("refuses re-deciding an already-decided discount", async () => {
    const res = await asSuperAdmin().post(`/api/v1/discounts/${discountId}/decide`).send({ decision: "REJECTED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_DECIDED");
  });
});
