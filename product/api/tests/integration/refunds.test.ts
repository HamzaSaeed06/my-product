import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let categoryId: string;
let studentId: string;
let invoiceId: string;
let paymentId: string;
let refundId: string;

describe("Refunds API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [category, student] = await Promise.all([
      prisma.feeCategory.create({ data: { name: `Refund-Test Category ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-REFUND-${suffix}`, fullName: `Refund Test ${suffix}` } }),
    ]);
    categoryId = category.id;
    studentId = student.id;

    const invoiceRes = await asSuperAdmin()
      .post("/api/v1/invoices")
      .send({ studentId, dueDate: "2026-09-30", items: [{ feeCategoryId: categoryId, description: "Fee", amount: "4000.00" }] });
    // Fail loudly here rather than letting an undefined invoiceId cascade
    // into confusing VALIDATION_ERROR failures in every downstream test.
    if (invoiceRes.status !== 201) throw new Error(`Fixture setup failed: invoice creation returned ${invoiceRes.status}: ${JSON.stringify(invoiceRes.body)}`);
    invoiceId = invoiceRes.body.id;

    const paymentRes = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId, amount: "4000.00" });
    if (paymentRes.status !== 201) throw new Error(`Fixture setup failed: payment creation returned ${paymentRes.status}: ${JSON.stringify(paymentRes.body)}`);
    paymentId = paymentRes.body.id;
  });

  // Guards against beforeAll having failed/timed out partway through —
  // an unguarded `where: { paymentId }` with paymentId undefined would
  // otherwise become `where: {}` and delete every row in the table. See
  // docs/PROJECT_STATUS.md §5a.
  afterAll(async () => {
    if (paymentId) {
      await prisma.refund.deleteMany({ where: { paymentId } }).catch(() => {});
      await prisma.receipt.deleteMany({ where: { paymentId } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { id: paymentId } }).catch(() => {});
    }
    if (invoiceId) {
      await prisma.paymentAllocation.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: invoiceId } }).catch(() => {});
    }
    if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    if (categoryId) await prisma.feeCategory.delete({ where: { id: categoryId } }).catch(() => {});
  });

  it("refuses a refund amount exceeding the original payment", async () => {
    const res = await asSuperAdmin().post("/api/v1/refunds").send({ paymentId, amount: "5000.00", reason: "Withdrawal" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_AMOUNT");
  });

  it("creates a refund request", async () => {
    const res = await asSuperAdmin().post("/api/v1/refunds").send({ paymentId, amount: "4000.00", reason: "Student withdrew mid-year" });
    expect(res.status).toBe(201);
    expect(res.body.refundNumber).toMatch(/^REFUND-\d{4}-\d{6}$/);
    refundId = res.body.id;
  });

  it("refuses completing a refund before it's approved", async () => {
    const res = await asSuperAdmin().post(`/api/v1/refunds/${refundId}/complete`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("NOT_APPROVED");
  });

  it("approves the refund", async () => {
    const res = await asSuperAdmin().post(`/api/v1/refunds/${refundId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("refuses deciding an already-decided refund", async () => {
    const res = await asSuperAdmin().post(`/api/v1/refunds/${refundId}/decide`).send({ decision: "REJECTED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_DECIDED");
  });

  it("completes the refund", async () => {
    const res = await asSuperAdmin().post(`/api/v1/refunds/${refundId}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
  });

  it("lists refunds filtered by status", async () => {
    const res = await asSuperAdmin().get("/api/v1/refunds?status=COMPLETED");
    expect(res.status).toBe(200);
    expect(res.body.some((r: { id: string }) => r.id === refundId)).toBe(true);
  });
});
