import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let categoryId: string;
let studentId: string;
let invoiceId: string;
let waiverId: string;

describe("Waivers API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [category, student] = await Promise.all([
      prisma.feeCategory.create({ data: { name: `Waiver-Test Category ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-WAIVER-${suffix}`, fullName: `Waiver Test ${suffix}` } }),
    ]);
    categoryId = category.id;
    studentId = student.id;

    const invoiceRes = await asSuperAdmin()
      .post("/api/v1/invoices")
      .send({ studentId, dueDate: "2026-09-30", items: [{ feeCategoryId: categoryId, description: "Fee", amount: "2000.00" }] });
    // Fail loudly here rather than letting an undefined invoiceId cascade
    // into confusing failures in every downstream test.
    if (invoiceRes.status !== 201) throw new Error(`Fixture setup failed: invoice creation returned ${invoiceRes.status}: ${JSON.stringify(invoiceRes.body)}`);
    invoiceId = invoiceRes.body.id;
  });

  // Guarded against a partially-failed beforeAll — see refunds.test.ts /
  // docs/PROJECT_STATUS.md §5a.
  afterAll(async () => {
    if (invoiceId) {
      await prisma.waiver.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: invoiceId } }).catch(() => {});
    }
    if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    if (categoryId) await prisma.feeCategory.delete({ where: { id: categoryId } }).catch(() => {});
  });

  it("refuses a waiver amount exceeding the invoice total", async () => {
    const res = await asSuperAdmin().post("/api/v1/waivers").send({ invoiceId, amount: "3000.00", reason: "Financial hardship" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_AMOUNT");
  });

  it("creates a partial waiver request", async () => {
    const res = await asSuperAdmin().post("/api/v1/waivers").send({ invoiceId, amount: "2000.00", reason: "Financial hardship, full waiver" });
    expect(res.status).toBe(201);
    waiverId = res.body.id;
  });

  it("approving the waiver recalculates the invoice to PAID", async () => {
    const res = await asSuperAdmin().post(`/api/v1/waivers/${waiverId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    expect(invoice.status).toBe("PAID");
  });

  it("refuses re-deciding an already-decided waiver", async () => {
    const res = await asSuperAdmin().post(`/api/v1/waivers/${waiverId}/decide`).send({ decision: "REJECTED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_DECIDED");
  });

  it("lists waivers filtered by invoice", async () => {
    const res = await asSuperAdmin().get(`/api/v1/waivers?invoiceId=${invoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
