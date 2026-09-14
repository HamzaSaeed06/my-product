import { mockInvoices } from "./invoices";
import type { ApprovalStatus } from "./discounts";

// Unlike a Discount, a Waiver targets one specific Invoice directly —
// reduces what's already owed on a generated bill, factored into that
// invoice's remaining-balance calculation.
export interface Waiver {
  id: string;
  invoiceId: string;
  amount: number;
  reason: string;
  status: ApprovalStatus;
  requestedById: string;
  approvedById: string | null;
  approvedAt: string | null;
}

const partiallyPaidInvoice = mockInvoices.find((i) => i.status === "PARTIALLY_PAID");

export const mockWaivers: Waiver[] = partiallyPaidInvoice
  ? [
      {
        id: "wv_1",
        invoiceId: partiallyPaidInvoice.id,
        amount: 500,
        reason: "Late fee waived — family was affected by the flooding in their area last month.",
        status: "APPROVED",
        requestedById: "usr_office_1",
        approvedById: "usr_head_main",
        approvedAt: "2026-09-11T00:00:00",
      },
    ]
  : [];
