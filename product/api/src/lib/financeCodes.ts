import { prisma } from "./prisma.js";

// Same "read the highest existing suffix + 1" approach as studentCode.ts —
// no dedicated sequence table, since a P2002-retry at the call site covers
// the rare concurrent-create race. Codes are year-scoped per spec's worked
// examples (e.g. "INV-2026-000125"), so the sequence resets each year.
async function nextCode(prefix: string, findLastCode: (yearPrefix: string) => Promise<string | null>): Promise<string> {
  const yearPrefix = `${prefix}-${new Date().getFullYear()}-`;
  const last = await findLastCode(yearPrefix);
  const lastNumber = last ? parseInt(last.slice(yearPrefix.length), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${yearPrefix}${String(next).padStart(6, "0")}`;
}

export function generateInvoiceNumber() {
  return nextCode("INV", async (yearPrefix) => {
    const last = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: yearPrefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    return last?.invoiceNumber ?? null;
  });
}

export function generatePaymentNumber() {
  return nextCode("PAY", async (yearPrefix) => {
    const last = await prisma.payment.findFirst({
      where: { paymentNumber: { startsWith: yearPrefix } },
      orderBy: { paymentNumber: "desc" },
      select: { paymentNumber: true },
    });
    return last?.paymentNumber ?? null;
  });
}

export function generateAllocationNumber() {
  return nextCode("ALLOC", async (yearPrefix) => {
    const last = await prisma.paymentAllocation.findFirst({
      where: { allocationNumber: { startsWith: yearPrefix } },
      orderBy: { allocationNumber: "desc" },
      select: { allocationNumber: true },
    });
    return last?.allocationNumber ?? null;
  });
}

export function generateAttemptNumber() {
  return nextCode("ATT", async (yearPrefix) => {
    const last = await prisma.paymentAttempt.findFirst({
      where: { attemptNumber: { startsWith: yearPrefix } },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true },
    });
    return last?.attemptNumber ?? null;
  });
}

export function generateReceiptNumber() {
  return nextCode("REC", async (yearPrefix) => {
    const last = await prisma.receipt.findFirst({
      where: { receiptNumber: { startsWith: yearPrefix } },
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });
    return last?.receiptNumber ?? null;
  });
}

export function generateCreditTransactionNumber() {
  return nextCode("CREDIT", async (yearPrefix) => {
    const last = await prisma.creditTransaction.findFirst({
      where: { transactionNumber: { startsWith: yearPrefix } },
      orderBy: { transactionNumber: "desc" },
      select: { transactionNumber: true },
    });
    return last?.transactionNumber ?? null;
  });
}

export function generateRefundNumber() {
  return nextCode("REFUND", async (yearPrefix) => {
    const last = await prisma.refund.findFirst({
      where: { refundNumber: { startsWith: yearPrefix } },
      orderBy: { refundNumber: "desc" },
      select: { refundNumber: true },
    });
    return last?.refundNumber ?? null;
  });
}
