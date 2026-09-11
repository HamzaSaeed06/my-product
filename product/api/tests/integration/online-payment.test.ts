import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, createTestUserWithRole, loginAsTestUser, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let studentId: string;
let parentUserId: string;
let parentId: string;
let parentClient: Awaited<ReturnType<typeof loginAsTestUser>>;
let feeCategoryId: string;
let gatewayId: string;
let webhookSecret: string;
let previouslyActiveGatewayIds: string[] = [];

// One fresh invoice per test that needs one, to keep tests independent —
// listed here so afterAll can clean them all up.
const createdInvoiceIds: string[] = [];
const createdAttemptIds: string[] = [];

function sign(body: string): string {
  return crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
}

async function createInvoice(amount: string): Promise<string> {
  const res = await asSuperAdmin()
    .post("/api/v1/invoices")
    .send({
      studentId,
      dueDate: "2027-01-01",
      items: [{ feeCategoryId, description: "Tuition", amount }],
    });
  if (res.status !== 201) throw new Error(`Invoice creation failed (${res.status}): ${JSON.stringify(res.body)}`);
  createdInvoiceIds.push(res.body.id);
  return res.body.id;
}

async function initiate(invoiceId: string, amount: string) {
  const res = await parentClient.post("/api/v1/online-payment/initiate").send({ invoiceId, amount });
  if (res.status !== 201) throw new Error(`Initiate failed (${res.status}): ${JSON.stringify(res.body)}`);
  createdAttemptIds.push(res.body.gatewayTransactionId);
  return res.body as { gatewayTransactionId: string; amount: string; gatewayName: string };
}

async function postCallback(payload: Record<string, unknown>, signatureOverride?: string) {
  const rawBody = JSON.stringify(payload);
  const signature = signatureOverride ?? sign(rawBody);
  return asSuperAdmin()
    .post("/api/v1/payment-callback")
    .set("X-Gateway-Signature", signature)
    .send(payload);
}

describe("Online Payment Integration (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const student = await prisma.student.create({ data: { studentCode: `STU-ONPAY-${suffix}`, fullName: `Online Pay Student ${suffix}` } });
    studentId = student.id;

    const parentUser = await createTestUserWithRole({
      email: `onpay-parent-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Online Pay Parent",
      roleName: "PARENT",
    });
    parentUserId = parentUser.id;
    const parent = await prisma.parent.create({ data: { fullName: "Online Pay Parent", phone: "555-0200", userId: parentUserId } });
    parentId = parent.id;
    await prisma.studentParent.create({ data: { studentId, parentId, relationship: "Mother", isPrimary: true } });
    parentClient = await loginAsTestUser(parentUser.email, PASSWORD);

    const feeCategory = await prisma.feeCategory.create({ data: { name: `OnPay Fee ${suffix}`, instituteId: institute.id } });
    feeCategoryId = feeCategory.id;

    // Ensure exactly one active gateway (ours) so getActiveGateway() is
    // deterministic — see the module-level comment on why.
    const active = await prisma.paymentGateway.findMany({ where: { isActive: true } });
    previouslyActiveGatewayIds = active.map((g) => g.id);
    await prisma.paymentGateway.updateMany({ where: { isActive: true }, data: { isActive: false } });

    const gwRes = await asSuperAdmin().post("/api/v1/payment-gateways").send({ provider: "SIMULATED", name: `Test Gateway ${suffix}` });
    if (gwRes.status !== 201) throw new Error(`Gateway creation failed (${gwRes.status}): ${JSON.stringify(gwRes.body)}`);
    gatewayId = gwRes.body.id;
    webhookSecret = gwRes.body.webhookSecret;
  }, 60000);

  afterAll(async () => {
    if (createdAttemptIds.length) {
      await prisma.paymentCallback.deleteMany({ where: { gatewayTransactionId: { in: createdAttemptIds } } }).catch(() => {});
    }
    if (createdInvoiceIds.length) {
      await prisma.paymentAllocation.deleteMany({ where: { invoiceId: { in: createdInvoiceIds } } }).catch(() => {});
      await prisma.refund.deleteMany({ where: { payment: { studentId } } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { studentId } }).catch(() => {});
      await prisma.gatewayTransaction.deleteMany({ where: { attempt: { invoiceId: { in: createdInvoiceIds } } } }).catch(() => {});
      await prisma.paymentAttempt.deleteMany({ where: { invoiceId: { in: createdInvoiceIds } } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: createdInvoiceIds } } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: { in: createdInvoiceIds } } }).catch(() => {});
    }
    await prisma.reconciliationException.deleteMany({ where: { gatewayTxnId: { contains: suffix } } }).catch(() => {});
    if (feeCategoryId) await prisma.feeCategory.deleteMany({ where: { id: feeCategoryId } }).catch(() => {});
    if (parentId) await prisma.studentParent.deleteMany({ where: { parentId } }).catch(() => {});
    if (parentId) await prisma.parent.deleteMany({ where: { id: parentId } }).catch(() => {});
    if (parentUserId) await prisma.user.deleteMany({ where: { id: parentUserId } }).catch(() => {});
    if (studentId) await prisma.student.deleteMany({ where: { id: studentId } }).catch(() => {});
    if (gatewayId) await prisma.paymentGateway.deleteMany({ where: { id: gatewayId } }).catch(() => {});
    if (previouslyActiveGatewayIds.length) {
      await prisma.paymentGateway.updateMany({ where: { id: { in: previouslyActiveGatewayIds } }, data: { isActive: true } }).catch(() => {});
    }
  });

  it("1. successful payment: initiate -> confirm -> real signed webhook creates a Payment", async () => {
    const invoiceId = await createInvoice("500.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "500.00");

    const confirmRes = await parentClient.post(`/api/v1/online-payment/${gatewayTransactionId}/confirm`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.outcome).toBe("SUCCESS");
    expect(confirmRes.body.payment.method).toBe("ONLINE");

    const invoiceRes = await asSuperAdmin().get(`/api/v1/invoices/${invoiceId}`);
    expect(invoiceRes.body.status).toBe("PAID");
  }, 60000);

  it("2. failed payment: a cancelled checkout creates no payment", async () => {
    const invoiceId = await createInvoice("300.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "300.00");

    const cancelRes = await parentClient.post(`/api/v1/online-payment/${gatewayTransactionId}/cancel`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.outcome).toBe("FAILED");

    const invoiceRes = await asSuperAdmin().get(`/api/v1/invoices/${invoiceId}`);
    expect(invoiceRes.body.status).toBe("UNPAID");
  }, 40000);

  it("3. pending payment: a PENDING callback marks the transaction pending, no payment yet", async () => {
    const invoiceId = await createInvoice("400.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "400.00");

    const gatewayTxnId = `TEST-PENDING-${suffix}`;
    const res = await postCallback({ gatewayId, merchantTxnId: gatewayTransactionId, gatewayTxnId, status: "PENDING", amount: "400.00" });
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe("PENDING");

    const invoiceRes = await asSuperAdmin().get(`/api/v1/invoices/${invoiceId}`);
    expect(invoiceRes.body.status).toBe("UNPAID");
  }, 40000);

  it("4. duplicate callback: a replayed SUCCESS callback does not create a second payment", async () => {
    const invoiceId = await createInvoice("600.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "600.00");

    const gatewayTxnId = `TEST-DUP-${suffix}`;
    const payload = { gatewayId, merchantTxnId: gatewayTransactionId, gatewayTxnId, status: "SUCCESS", amount: "600.00" };

    const first = await postCallback(payload);
    expect(first.status).toBe(200);
    expect(first.body.outcome).toBe("SUCCESS");

    const second = await postCallback(payload);
    expect(second.status).toBe(200);
    expect(second.body.outcome).toBe("DUPLICATE_IGNORED");

    const payments = await prisma.payment.findMany({ where: { allocations: { some: { invoiceId } } } });
    expect(payments).toHaveLength(1);
  }, 40000);

  it("5. amount mismatch: a callback with the wrong amount is flagged, never auto-paid", async () => {
    const invoiceId = await createInvoice("700.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "700.00");

    const gatewayTxnId = `TEST-MISMATCH-${suffix}`;
    const res = await postCallback({ gatewayId, merchantTxnId: gatewayTransactionId, gatewayTxnId, status: "SUCCESS", amount: "1.00" });
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe("AMOUNT_MISMATCH");

    const invoiceRes = await asSuperAdmin().get(`/api/v1/invoices/${invoiceId}`);
    expect(invoiceRes.body.status).toBe("UNPAID");

    const exception = await prisma.reconciliationException.findFirst({ where: { gatewayTxnId } });
    expect(exception).not.toBeNull();
  });

  it("6. unmatched transaction: a callback for an unknown merchantTxnId creates a reconciliation exception, never a payment", async () => {
    const gatewayTxnId = `TEST-UNMATCHED-${suffix}`;
    const res = await postCallback({ gatewayId, merchantTxnId: "00000000-0000-0000-0000-000000000000", gatewayTxnId, status: "SUCCESS", amount: "50.00" });
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe("UNMATCHED");

    const exception = await prisma.reconciliationException.findFirst({ where: { gatewayTxnId } });
    expect(exception).not.toBeNull();
    expect(exception!.status).toBe("PENDING");
  });

  it("8. invalid callback signature: rejected, never processed", async () => {
    const invoiceId = await createInvoice("800.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "800.00");

    const gatewayTxnId = `TEST-BADSIG-${suffix}`;
    const payload = { gatewayId, merchantTxnId: gatewayTransactionId, gatewayTxnId, status: "SUCCESS", amount: "800.00" };
    const res = await postCallback(payload, "0".repeat(64));
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_SIGNATURE");

    const invoiceRes = await asSuperAdmin().get(`/api/v1/invoices/${invoiceId}`);
    expect(invoiceRes.body.status).toBe("UNPAID");

    const callback = await prisma.paymentCallback.findFirst({ where: { gatewayTxnId } });
    expect(callback!.signatureValid).toBe(false);
  });

  it("6b. concurrent payments: a SUCCESS callback for an already cash-paid invoice does not double-pay", async () => {
    const invoiceId = await createInvoice("900.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "900.00");

    // Office records a cash payment for the same invoice first.
    const cashRes = await asSuperAdmin().post("/api/v1/payments").send({ studentId, invoiceId, amount: "900.00" });
    expect(cashRes.status).toBe(201);

    const gatewayTxnId = `TEST-CONCURRENT-${suffix}`;
    const res = await postCallback({ gatewayId, merchantTxnId: gatewayTransactionId, gatewayTxnId, status: "SUCCESS", amount: "900.00" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVOICE_ALREADY_PAID");

    const payments = await prisma.payment.findMany({ where: { allocations: { some: { invoiceId } } } });
    expect(payments).toHaveLength(1);
    expect(payments[0]!.method).toBe("CASH");
  }, 40000);

  it("9. reconciliation summary: gateway vs school-record totals match after a successful payment", async () => {
    const invoiceId = await createInvoice("250.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "250.00");
    const confirmRes = await parentClient.post(`/api/v1/online-payment/${gatewayTransactionId}/confirm`);
    expect(confirmRes.status).toBe(200);

    const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await asSuperAdmin().get(`/api/v1/payment-reconciliation?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    expect(res.status).toBe(200);
    expect(res.body.gateway.count).toBeGreaterThanOrEqual(1);
    expect(res.body.gateway.count).toBe(res.body.schoolRecords.count);
    expect(res.body.matched).toBe(true);
  }, 40000);

  it("10. refund through gateway: completing a refund on an online payment records a gatewayRefundReference", async () => {
    const invoiceId = await createInvoice("350.00");
    const { gatewayTransactionId } = await initiate(invoiceId, "350.00");
    const confirmRes = await parentClient.post(`/api/v1/online-payment/${gatewayTransactionId}/confirm`);
    const paymentId = confirmRes.body.payment.id as string;

    const refundRes = await asSuperAdmin().post("/api/v1/refunds").send({ paymentId, amount: "350.00", reason: "Withdrawal" });
    expect(refundRes.status).toBe(201);
    const refundId = refundRes.body.id as string;

    const decideRes = await asSuperAdmin().post(`/api/v1/refunds/${refundId}/decide`).send({ decision: "APPROVED" });
    expect(decideRes.status).toBe(200);

    const completeRes = await asSuperAdmin().post(`/api/v1/refunds/${refundId}/complete`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.gatewayRefundReference).toMatch(/^GWREFUND-/);
  }, 50000);

  describe("scope enforcement", () => {
    it("refuses initiating an online payment for a student who isn't the parent's child", async () => {
      const otherStudent = await prisma.student.create({ data: { studentCode: `STU-ONPAY-OTHER-${suffix}`, fullName: `Other Student ${suffix}` } });
      const otherInvoiceRes = await asSuperAdmin()
        .post("/api/v1/invoices")
        .send({ studentId: otherStudent.id, dueDate: "2027-01-01", items: [{ feeCategoryId, description: "Tuition", amount: "100.00" }] });
      expect(otherInvoiceRes.status).toBe(201);

      const res = await parentClient.post("/api/v1/online-payment/initiate").send({ invoiceId: otherInvoiceRes.body.id, amount: "100.00" });
      expect(res.status).toBe(403);

      await prisma.invoiceItem.deleteMany({ where: { invoiceId: otherInvoiceRes.body.id } });
      await prisma.invoice.delete({ where: { id: otherInvoiceRes.body.id } });
      await prisma.student.delete({ where: { id: otherStudent.id } });
    });

    it("refuses a Teacher (no payment.pay_online) from initiating an online payment", async () => {
      const teacherUser = await createTestUserWithRole({
        email: `onpay-teacher-${suffix}@example.test`,
        password: PASSWORD,
        fullName: "Online Pay Teacher",
        roleName: "TEACHER",
      });
      const teacherClient = await loginAsTestUser(teacherUser.email, PASSWORD);
      const invoiceId = await createInvoice("100.00");

      const res = await teacherClient.post("/api/v1/online-payment/initiate").send({ invoiceId, amount: "100.00" });
      expect(res.status).toBe(403);

      await prisma.user.delete({ where: { id: teacherUser.id } });
    });
  });
});
