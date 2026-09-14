import { mockInvoices } from "./invoices";

export type PaymentMethod = "CASH" | "ONLINE";
export type PaymentStatus = "SUCCESS" | "REVERSED";

export interface Payment {
  id: string;
  paymentNumber: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  recordedById: string;
  reversedById: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
}

// The join to Invoice — a Payment can fund multiple invoices, and
// partially (each allocation carries its own amount), confirmed from the
// real schema. This mock only ever allocates one payment to one invoice
// since none of the seeded invoices need splitting across two payments.
export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  status: "ACTIVE" | "REVERSED";
}

export type ReversalRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// Reversal is request→decide, a maker-checker pair — confirmed two
// separate routes in the real backend (payment.record files the request,
// payment.reverse decides it), same shape as Discounts/Waivers/Refunds.
export interface PaymentReversalRequest {
  id: string;
  paymentId: string;
  reason: string;
  status: ReversalRequestStatus;
  requestedById: string;
  requestedAt: string;
  decidedById: string | null;
  decidedAt: string | null;
}

const paidInvoice = mockInvoices.find((i) => i.status === "PAID");
const partiallyPaidInvoice = mockInvoices.find((i) => i.status === "PARTIALLY_PAID");
const reversedTargetInvoice = mockInvoices.find((i) => i.status === "UNPAID");

export const mockPayments: Payment[] = [
  ...(paidInvoice
    ? [{ id: `pay_${paidInvoice.id}`, paymentNumber: "PMT-2026-00101", studentId: paidInvoice.studentId, amount: paidInvoice.totalAmount, method: "CASH" as PaymentMethod, status: "SUCCESS" as PaymentStatus, recordedById: "usr_office_1", reversedById: null, reversedAt: null, reversalReason: null }]
    : []),
  ...(partiallyPaidInvoice
    ? [{ id: `pay_${partiallyPaidInvoice.id}`, paymentNumber: "PMT-2026-00102", studentId: partiallyPaidInvoice.studentId, amount: 3000, method: "ONLINE" as PaymentMethod, status: "SUCCESS" as PaymentStatus, recordedById: "usr_office_1", reversedById: null, reversedAt: null, reversalReason: null }]
    : []),
  ...(reversedTargetInvoice
    ? [{ id: `pay_${reversedTargetInvoice.id}_rev`, paymentNumber: "PMT-2026-00103", studentId: reversedTargetInvoice.studentId, amount: 6500, method: "CASH" as PaymentMethod, status: "REVERSED" as PaymentStatus, recordedById: "usr_office_1", reversedById: "usr_head_main", reversedAt: "2026-09-12T00:00:00", reversalReason: "Recorded against the wrong student — re-entered correctly under the intended student." }]
    : []),
];

export const mockPaymentAllocations: PaymentAllocation[] = [
  ...(paidInvoice ? [{ id: `pal_${paidInvoice.id}`, paymentId: `pay_${paidInvoice.id}`, invoiceId: paidInvoice.id, amount: paidInvoice.totalAmount, status: "ACTIVE" as const }] : []),
  ...(partiallyPaidInvoice ? [{ id: `pal_${partiallyPaidInvoice.id}`, paymentId: `pay_${partiallyPaidInvoice.id}`, invoiceId: partiallyPaidInvoice.id, amount: 3000, status: "ACTIVE" as const }] : []),
];

export const mockReversalRequests: PaymentReversalRequest[] = paidInvoice
  ? [
      {
        id: "prr_1",
        paymentId: `pay_${paidInvoice.id}`,
        reason: "Parent paid twice by mistake within the same hour — this second payment should be reversed and refunded.",
        status: "PENDING",
        requestedById: "usr_office_1",
        requestedAt: "2026-09-13T11:00:00",
        decidedById: null,
        decidedAt: null,
      },
    ]
  : [];
