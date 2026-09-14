export interface ReconciliationDaySummary {
  date: string;
  gatewayCount: number;
  gatewayTotal: number;
  recordedCount: number;
  recordedTotal: number;
}

export type ExceptionStatus = "PENDING" | "RESOLVED" | "REJECTED";

// A callback that can't be matched, or whose amount mismatches, never
// auto-creates a Payment — it becomes an exception for manual review. This
// is the real backend's own "Reconciliation Safety Rule."
export interface ReconciliationException {
  id: string;
  gatewayTransactionId: string;
  amount: number;
  reason: string;
  status: ExceptionStatus;
  filedById: string;
  filedAt: string;
  resolvedById: string | null;
  resolvedAt: string | null;
}

export const mockReconciliationSummary: ReconciliationDaySummary = {
  date: "2026-09-13",
  gatewayCount: 14,
  gatewayTotal: 187500,
  recordedCount: 13,
  recordedTotal: 184500,
};

export const mockReconciliationExceptions: ReconciliationException[] = [
  {
    id: "rex_1",
    gatewayTransactionId: "SIM-TXN-55921",
    amount: 3000,
    reason: "Amount mismatch — gateway reported Rs 3,000 but no Payment of that amount was recorded for the matching student that day.",
    status: "PENDING",
    filedById: "system",
    filedAt: "2026-09-13T18:05:00",
    resolvedById: null,
    resolvedAt: null,
  },
];
