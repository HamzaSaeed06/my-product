import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateInvoiceNumber } from "../../lib/financeCodes.js";
import { studentScopeWhereDirect, type StudentScopeFilter } from "../../lib/scope.js";

function include() {
  return {
    items: { include: { feeCategory: true } },
    allocations: { where: { status: "ACTIVE" as const } },
    waivers: { where: { status: "APPROVED" as const } },
  } as const;
}

// Recomputes Invoice.status from its actual paid/waived/credited amount —
// called after every mutation that could change what's owed (payment
// recorded, payment reversed, waiver approved). Never mutates a VOID
// invoice's status; void is terminal.
export async function recalculateInvoiceStatus(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status === "VOID") return invoice;

  const [allocations, waivers, credits] = await Promise.all([
    tx.paymentAllocation.aggregate({ where: { invoiceId, status: "ACTIVE" }, _sum: { amount: true } }),
    tx.waiver.aggregate({ where: { invoiceId, status: "APPROVED" }, _sum: { amount: true } }),
    tx.creditTransaction.aggregate({ where: { usedOnInvoiceId: invoiceId, status: "USED" }, _sum: { amount: true } }),
  ]);

  const paid = new Prisma.Decimal(allocations._sum.amount ?? 0)
    .plus(waivers._sum.amount ?? 0)
    .plus(credits._sum.amount ?? 0);

  const status = paid.gte(invoice.totalAmount) ? "PAID" : paid.gt(0) ? "PARTIALLY_PAID" : "UNPAID";

  return tx.invoice.update({ where: { id: invoiceId }, data: { status } });
}

export async function listInvoices(filter: StudentScopeFilter & { status?: string }) {
  return prisma.invoice.findMany({
    where: { ...studentScopeWhereDirect(filter), status: filter.status as never },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: include() });
  if (!invoice) throw new HttpError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  return invoice;
}

export async function createInvoice(
  input: {
    studentId: string;
    dueDate: Date;
    items: { feeCategoryId: string; description: string; amount: string }[];
  },
  actorId: string
) {
  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student || student.status === "ARCHIVED") throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  if (input.items.length === 0) throw new HttpError(400, "NO_ITEMS", "An invoice needs at least one item");

  // Snapshot the student's campus (via active enrollment) at invoicing
  // time — deliberately not re-derived later, so this invoice stays
  // attributed to the campus that issued it even if the student
  // transfers campuses afterward. Null only if the student has no active
  // enrollment when invoiced directly (rare, not disallowed).
  const activeEnrollment = await prisma.enrollment.findFirst({
    where: { studentId: input.studentId, status: "ACTIVE" },
    include: { section: true },
  });
  const campusId = activeEnrollment?.section.campusId;

  const categoryIds = [...new Set(input.items.map((i) => i.feeCategoryId))];
  const categories = await prisma.feeCategory.findMany({ where: { id: { in: categoryIds } } });
  if (categories.length !== categoryIds.length) throw new HttpError(400, "FEE_CATEGORY_NOT_FOUND", "One or more feeCategoryIds do not exist");

  const totalAmount = input.items.reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));

  const invoiceNumber = await generateInvoiceNumber();

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: input.studentId,
        campusId,
        dueDate: input.dueDate,
        totalAmount,
        items: { create: input.items },
      },
      include: include(),
    });

    await writeAuditLog({
      actorId,
      action: "CREATE",
      resource: "Invoice",
      recordId: invoice.id,
      newValue: { invoiceNumber, studentId: input.studentId, totalAmount: totalAmount.toString() },
    });

    return invoice;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "INVOICE_NUMBER_COLLISION", "Invoice number collision — retry");
    }
    throw err;
  }
}

export async function voidInvoice(id: string, reason: string, actorId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new HttpError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  if (invoice.status === "VOID") throw new HttpError(409, "ALREADY_VOID", "Invoice is already void");
  if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
    throw new HttpError(409, "INVOICE_HAS_PAYMENTS", "Cannot void an invoice with active payments — reverse the payment(s) first");
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "VOID", voidedAt: new Date(), voidReason: reason },
  });

  await writeAuditLog({ actorId, action: "VOID", resource: "Invoice", recordId: id, reason, newValue: { status: "VOID" } });

  return updated;
}
