import { getSectionRoster } from "./sections";

export type DiscountType = "SIBLING" | "MERIT" | "STAFF" | "OTHER";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

// Applies at the FeeStructure level (or student-wide if feeStructureId is
// null) — reduces what future invoices for that structure should charge,
// not an existing invoice directly (that's what a Waiver is for). amount
// and percentage are mutually exclusive, validated service-side in the
// real backend, not a DB constraint.
export interface Discount {
  id: string;
  studentId: string;
  feeStructureId: string | null;
  type: DiscountType;
  amount: number | null;
  percentage: number | null;
  reason: string;
  status: ApprovalStatus;
  requestedById: string;
  approvedById: string | null;
  approvedAt: string | null;
}

const sec2Roster = getSectionRoster("sec_2");

export const mockDiscounts: Discount[] = sec2Roster[0]
  ? [
      {
        id: "disc_1",
        studentId: sec2Roster[0].id,
        feeStructureId: "fs_1",
        type: "SIBLING",
        amount: null,
        percentage: 10,
        reason: "Two siblings currently enrolled — standard sibling discount on tuition.",
        status: "APPROVED",
        requestedById: "usr_office_1",
        approvedById: "usr_head_main",
        approvedAt: "2026-06-05T00:00:00",
      },
      {
        id: "disc_2",
        studentId: sec2Roster[1]?.id ?? sec2Roster[0].id,
        feeStructureId: null,
        type: "MERIT",
        amount: 1000,
        percentage: null,
        reason: "Topped the class in the previous academic year.",
        status: "PENDING",
        requestedById: "usr_incharge_1",
        approvedById: null,
        approvedAt: null,
      },
    ]
  : [];
