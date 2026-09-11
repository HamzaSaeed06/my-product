import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let instituteId: string;
let categoryId: string;
let studentId: string;
let invoiceId: string;

describe("Invoices API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    instituteId = institute.id;

    const [category, student] = await Promise.all([
      prisma.feeCategory.create({ data: { name: `Invoice-Test Category ${suffix}`, instituteId } }),
      prisma.student.create({ data: { studentCode: `STU-INV-${suffix}`, fullName: `Invoice Test ${suffix}` } }),
    ]);
    categoryId = category.id;
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    await prisma.invoice.deleteMany({ where: { id: invoiceId } });
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    await prisma.feeCategory.delete({ where: { id: categoryId } }).catch(() => {});
  });

  it("refuses an invoice with no items", async () => {
    const res = await asSuperAdmin().post("/api/v1/invoices").send({ studentId, dueDate: "2026-09-30", items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("NO_ITEMS");
  });

  it("creates an invoice with a generated unique number and computed total", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/invoices")
      .send({
        studentId,
        dueDate: "2026-09-30",
        items: [
          { feeCategoryId: categoryId, description: "September tuition", amount: "5000.00" },
          { feeCategoryId: categoryId, description: "Late fee", amount: "200.00" },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
    expect(res.body.totalAmount).toBe("5200");
    expect(res.body.status).toBe("UNPAID");
    invoiceId = res.body.id;
  });

  it("gets the invoice detail", async () => {
    const res = await asSuperAdmin().get(`/api/v1/invoices/${invoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it("lists invoices filtered by student", async () => {
    const res = await asSuperAdmin().get(`/api/v1/invoices?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("voids the invoice", async () => {
    const res = await asSuperAdmin().post(`/api/v1/invoices/${invoiceId}/void`).send({ reason: "Created by mistake" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("VOID");
  });

  it("refuses voiding an already-void invoice", async () => {
    const res = await asSuperAdmin().post(`/api/v1/invoices/${invoiceId}/void`).send({ reason: "again" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_VOID");
  });
});
