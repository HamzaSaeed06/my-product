export type CashClosingStatus = "PENDING" | "APPROVED";

// One per campus per day, closing that day's cash collections against a
// manually counted actual balance. expectedBalance and variance are
// computed, not entered — confirmed from the real service.
export interface CashClosing {
  id: string;
  campusId: string;
  date: string;
  openingBalance: number;
  collections: number;
  refundsPaidOut: number;
  expectedBalance: number;
  actualBalance: number;
  variance: number;
  status: CashClosingStatus;
  closedById: string;
  approvedById: string | null;
  approvedAt: string | null;
}

function closing(input: Omit<CashClosing, "expectedBalance" | "variance">): CashClosing {
  const expectedBalance = input.openingBalance + input.collections - input.refundsPaidOut;
  return { ...input, expectedBalance, variance: input.actualBalance - expectedBalance };
}

export const mockCashClosings: CashClosing[] = [
  closing({ id: "cc_1", campusId: "cmp_main", date: "2026-09-12", openingBalance: 5000, collections: 42000, refundsPaidOut: 500, actualBalance: 46500, status: "APPROVED", closedById: "usr_office_1", approvedById: "usr_head_main", approvedAt: "2026-09-13T09:00:00" }),
  closing({ id: "cc_2", campusId: "cmp_main", date: "2026-09-13", openingBalance: 4700, collections: 38500, refundsPaidOut: 0, actualBalance: 43000, status: "PENDING", closedById: "usr_office_1", approvedById: null, approvedAt: null }),
];
