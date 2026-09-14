import { getSectionRoster } from "./sections";

export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  feeCategoryId: string;
  description: string;
  amount: number;
}

// A billing document — line items reference FeeCategory directly, not
// StudentFee/FeeStructure (no FK back to either), confirmed from the real
// schema. Created by manual line-item entry today, not auto-generated from
// StudentFee assignments. Void is terminal — no un-void.
export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  campusId: string;
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  voidedAt: string | null;
  voidReason: string | null;
}

const sec2Roster = getSectionRoster("sec_2");

function itemsFor(): Omit<InvoiceItem, "id" | "invoiceId">[] {
  return [
    { feeCategoryId: "fc_tuition", description: "Tuition — September 2026", amount: 5000 },
    { feeCategoryId: "fc_transport", description: "Transport — September 2026", amount: 1500 },
  ];
}

export const mockInvoices: Invoice[] = sec2Roster.map((s, i) => ({
  id: `inv_${s.id}`,
  invoiceNumber: `INV-2026-${String(1001 + i).padStart(5, "0")}`,
  studentId: s.id,
  campusId: "cmp_main",
  totalAmount: 6500,
  dueDate: "2026-09-10",
  status: i === 0 ? "PAID" : i === 1 ? "PARTIALLY_PAID" : i === 4 ? "VOID" : "UNPAID",
  voidedAt: i === 4 ? "2026-09-08T10:00:00" : null,
  voidReason: i === 4 ? "Student withdrew before the term started — invoice raised in error." : null,
}));

export const mockInvoiceItems: InvoiceItem[] = mockInvoices.flatMap((inv) =>
  itemsFor().map((item, j) => ({ id: `ii_${inv.id}_${j}`, invoiceId: inv.id, ...item })),
);
