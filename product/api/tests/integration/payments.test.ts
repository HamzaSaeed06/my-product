import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let categoryId: string;
let studentId: string;
let otherStudentId: string;
let invoiceAId: string; // partial -> full payment flow
let invoiceBId: string; // overpayment -> credit flow
let invoiceCId: string; // apply-credit flow
let invoiceDId: string; // online success flow
let invoiceEId: string; // online failure flow
let paymentAId2: string; // the second (4000) payment on invoice A, later reversed
let creditId: string;
let reversalApprovalId: string;
let attemptDId: string;
let attemptEId: string;

async function createTestInvoice(total: string) {
  const res = await asSuperAdmin()
    .post("/api/v1/invoices")
    .send({ studentId, dueDate: "2026-09-30", items: [{ feeCategoryId: categoryId, description: "Fee", amount: total }] });
  // Fail loudly here rather than letting an undefined invoiceId cascade
  // into confusing failures in every downstream test.
  if (res.status !== 201) throw new Error(`Fixture setup failed: invoice creation returned ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body.id as string;
}

describe("Payments API (real database)", () => {
  // This file's beforeAll does more sequential HTTP round-trips (2 student
  // creates + 5 invoice creations) than any other test file's — a longer
  // per-hook timeout here, rather than raising the global one further, per
  // docs/PROJECT_STATUS.md §5a.
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [category, student, otherStudent] = await Promise.all([
      prisma.feeCategory.create({ data: { name: `Payment-Test Category ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-PAY-${suffix}`, fullName: `Payment Test ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-PAY-OTHER-${suffix}`, fullName: `Payment Other ${suffix}` } }),
    ]);
    categoryId = category.id;
    studentId = student.id;
    otherStudentId = otherStudent.id;

    invoiceAId = await createTestInvoice("10000.00");
    invoiceBId = await createTestInvoice("5000.00");
    invoiceCId = await createTestInvoice("3000.00");
    invoiceDId = await createTestInvoice("1000.00");
    invoiceEId = await createTestInvoice("1000.00");
  }, 60000);

  // Guards against beforeAll having failed/timed out partway through — see
  // docs/PROJECT_STATUS.md §5a. Filters out undefined fixture ids so a
  // beforeAll failure surfaces its own real error instead of a secondary
  // Prisma validation error.
  afterAll(async () => {
    const invoiceIds = [invoiceAId, invoiceBId, invoiceCId, invoiceDId, invoiceEId].filter((id): id is string => Boolean(id));
    const studentIds = [studentId, otherStudentId].filter((id): id is string => Boolean(id));

    if (invoiceIds.length) {
      await prisma.paymentAllocation.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).catch(() => {});
      await prisma.paymentAttempt.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } }).catch(() => {});
    }
    if (studentIds.length) {
      await prisma.receipt.deleteMany({ where: { payment: { studentId: { in: studentIds } } } }).catch(() => {});
      await prisma.creditTransaction.deleteMany({ where: { studentId: { in: studentIds } } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { studentId: { in: studentIds } } }).catch(() => {});
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } }).catch(() => {});
    }
    await prisma.reconciliationException.deleteMany({ where: { gatewayTxnId: { contains: suffix } } }).catch(() => {});
    if (categoryId) await prisma.feeCategory.delete({ where: { id: categoryId } }).catch(() => {});
  });

  it("refuses a payment for a mismatched student", async () => {
    const res = await asSuperAdmin().post("/api/v1/payments").send({ studentId: otherStudentId, invoiceId: invoiceAId, amount: "1000.00" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVOICE_STUDENT_MISMATCH");
  });

  it("records a partial payment — invoice becomes PARTIALLY_PAID", async () => {
    const res = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId: invoiceAId, amount: "6000.00" });
    expect(res.status).toBe(201);
    expect(res.body.paymentNumber).toMatch(/^PAY-\d{4}-\d{6}$/);
    expect(res.body.receipt.receiptNumber).toMatch(/^REC-\d{4}-\d{6}$/);

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceAId } });
    expect(invoice.status).toBe("PARTIALLY_PAID");
  });

  it("records the remaining payment — invoice becomes PAID", async () => {
    const res = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId: invoiceAId, amount: "4000.00" });
    expect(res.status).toBe(201);
    paymentAId2 = res.body.id;

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceAId } });
    expect(invoice.status).toBe("PAID");
  });

  it("refuses a payment on an already-paid invoice", async () => {
    const res = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId: invoiceAId, amount: "100.00" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVOICE_ALREADY_PAID");
  });

  it("an overpayment creates a credit transaction for the excess", async () => {
    const res = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId: invoiceBId, amount: "7000.00" });
    expect(res.status).toBe(201);

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceBId } });
    expect(invoice.status).toBe("PAID");

    const credit = await prisma.creditTransaction.findFirstOrThrow({ where: { studentId, status: "AVAILABLE" } });
    expect(credit.amount.toString()).toBe("2000");
    creditId = credit.id;
  });

  it("applies the credit toward a new invoice alongside a payment for the remainder", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/payments")
      .send({ studentId, invoiceId: invoiceCId, amount: "1000.00", applyCreditId: creditId });
    expect(res.status).toBe(201);

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceCId } });
    expect(invoice.status).toBe("PAID");

    const credit = await prisma.creditTransaction.findUniqueOrThrow({ where: { id: creditId } });
    expect(credit.status).toBe("USED");
    expect(credit.usedOnInvoiceId).toBe(invoiceCId);
  });

  it("refuses applying an already-used credit again", async () => {
    const res = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId: invoiceDId, amount: "500.00", applyCreditId: creditId });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("CREDIT_NOT_AVAILABLE");
  });

  it("lists payments filtered by student", async () => {
    const res = await asSuperAdmin().get(`/api/v1/payments?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it("requests a payment reversal", async () => {
    const res = await asSuperAdmin().post(`/api/v1/payments/${paymentAId2}/request-reversal`).send({ reason: "Duplicate entry" });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("PAYMENT_REVERSAL");
    reversalApprovalId = res.body.id;
  });

  it("approves the reversal — payment/allocation/receipt flip status, never deleted, invoice recalculates", async () => {
    const res = await asSuperAdmin().post(`/api/v1/payments/reversals/${reversalApprovalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentAId2 } });
    expect(payment.status).toBe("REVERSED");

    const allocation = await prisma.paymentAllocation.findFirstOrThrow({ where: { paymentId: paymentAId2 } });
    expect(allocation.status).toBe("REVERSED");

    const receipt = await prisma.receipt.findFirstOrThrow({ where: { paymentId: paymentAId2 } });
    expect(receipt.status).toBe("CANCELLED");

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceAId } });
    expect(invoice.status).toBe("PARTIALLY_PAID"); // the first 6000 allocation is still active
  });

  it("refuses re-deciding an already-decided reversal", async () => {
    const res = await asSuperAdmin().post(`/api/v1/payments/reversals/${reversalApprovalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("APPROVAL_ALREADY_DECIDED");
  });

  it("initiates a payment attempt and processes a successful gateway callback", async () => {
    const initRes = await asSuperAdmin().post("/api/v1/payments/attempts").send({ invoiceId: invoiceDId, amount: "1000.00" });
    expect(initRes.status).toBe(201);
    expect(initRes.body.status).toBe("INITIATED");
    attemptDId = initRes.body.id;

    const callbackRes = await asSuperAdmin()
      .post(`/api/v1/payments/attempts/${attemptDId}/callback`)
      .send({ status: "SUCCESS", gatewayTxnId: `TXN-${suffix}-D` });
    expect(callbackRes.status).toBe(200);
    expect(callbackRes.body.alreadyProcessed).toBe(false);
    expect(callbackRes.body.payment.method).toBe("ONLINE");

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceDId } });
    expect(invoice.status).toBe("PAID");
  });

  it("a replayed callback for the same attempt is idempotent", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/payments/attempts/${attemptDId}/callback`)
      .send({ status: "SUCCESS", gatewayTxnId: `TXN-${suffix}-D` });
    expect(res.status).toBe(200);
    expect(res.body.alreadyProcessed).toBe(true);
  });

  it("a failed gateway callback marks the attempt FAILED without creating a payment", async () => {
    const initRes = await asSuperAdmin().post("/api/v1/payments/attempts").send({ invoiceId: invoiceEId, amount: "1000.00" });
    attemptEId = initRes.body.id;

    const res = await asSuperAdmin()
      .post(`/api/v1/payments/attempts/${attemptEId}/callback`)
      .send({ status: "FAILED", gatewayTxnId: `TXN-${suffix}-E` });
    expect(res.status).toBe(200);
    expect(res.body.attempt.status).toBe("FAILED");

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceEId } });
    expect(invoice.status).toBe("UNPAID");
  });

  it("an unmatched gateway transaction creates a reconciliation exception, never an auto-payment", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/payments/reconciliation-exceptions")
      .send({ gatewayTxnId: `TXN-${suffix}-UNMATCHED`, amount: "500.00", rawData: { note: "test" } });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
  });

  it("refuses recording a transaction that already matches a real attempt", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/payments/reconciliation-exceptions")
      .send({ gatewayTxnId: `TXN-${suffix}-D`, amount: "1000.00", rawData: {} });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ATTEMPT_ALREADY_MATCHED");
  });

  it("lists and resolves a reconciliation exception", async () => {
    const listRes = await asSuperAdmin().get("/api/v1/payments/reconciliation-exceptions?status=PENDING");
    expect(listRes.status).toBe(200);
    const exception = listRes.body.find((e: { gatewayTxnId: string }) => e.gatewayTxnId === `TXN-${suffix}-UNMATCHED`);
    expect(exception).toBeDefined();

    const resolveRes = await asSuperAdmin()
      .post(`/api/v1/payments/reconciliation-exceptions/${exception.id}/resolve`)
      .send({ decision: "REJECTED", note: "Duplicate webhook, no invoice match found" });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe("REJECTED");
  });
});
