import { mockPayments, type PaymentMethod } from "./payments";

// 4-state, and confirmed to be more than "approve = done": approval alone
// doesn't move money, COMPLETED is a distinct later step (triggers a
// gateway-side reversal if the original payment was ONLINE).
export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface Refund {
  id: string;
  refundNumber: string;
  paymentId: string;
  amount: number;
  reason: string;
  method: PaymentMethod | null;
  status: RefundStatus;
  requestedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  gatewayRefundReference: string | null;
}

const onlinePayment = mockPayments.find((p) => p.method === "ONLINE");
const cashPayment = mockPayments.find((p) => p.method === "CASH" && p.status === "SUCCESS");

export const mockRefunds: Refund[] = [
  ...(onlinePayment
    ? [
        {
          id: "rf_1",
          refundNumber: "RFD-2026-00021",
          paymentId: onlinePayment.id,
          amount: 1500,
          reason: "Transport fee refunded — family arranged their own transport partway through the month.",
          method: "ONLINE" as PaymentMethod,
          status: "COMPLETED" as RefundStatus,
          requestedById: "usr_office_1",
          approvedById: "usr_head_main",
          approvedAt: "2026-09-05T00:00:00",
          completedAt: "2026-09-06T09:00:00",
          gatewayRefundReference: "SIM-REFUND-88421",
        },
      ]
    : []),
  ...(cashPayment
    ? [
        {
          id: "rf_2",
          refundNumber: "RFD-2026-00022",
          paymentId: cashPayment.id,
          amount: 500,
          reason: "Overcharged by mistake at collection — Rs 500 to be returned.",
          method: null,
          status: "PENDING" as RefundStatus,
          requestedById: "usr_office_1",
          approvedById: null,
          approvedAt: null,
          completedAt: null,
          gatewayRefundReference: null,
        },
      ]
    : []),
];
