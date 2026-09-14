import { getSectionRoster } from "./sections";

export type PromotionDecision = "PROMOTE" | "REPEAT" | "CLASS_JUMP" | "PENDING";
// PROMOTE/REPEAT execute immediately (a new Enrollment is created right
// away). CLASS_JUMP needs approval (Campus Head) before it executes.
// PENDING (awaiting a re-exam) never auto-executes on its own.
export type PromotionStatus = "AWAITING_APPROVAL" | "AWAITING_REEXAM" | "EXECUTED" | "REJECTED";

export interface Promotion {
  id: string;
  studentId: string;
  fromEnrollmentId: string;
  fromSectionId: string;
  targetAcademicYearId: string;
  targetClassId: string;
  targetSectionId: string | null;
  decision: PromotionDecision;
  reason: string | null;
  status: PromotionStatus;
  decidedById: string;
  decidedAt: string;
}

const sec2Roster = getSectionRoster("sec_2");

// No algorithmic promote/retain suggestion in the real backend — purely a
// manual per-student decision, confirmed from the service code. One
// CLASS_JUMP already sitting in AWAITING_APPROVAL — the rest of sec_2's
// roster hasn't been decided yet, which is the normal starting state.
export const mockPromotions: Promotion[] = sec2Roster[0]
  ? [
      {
        id: "prom_1",
        studentId: sec2Roster[0].id,
        fromEnrollmentId: "enr_seed_1",
        fromSectionId: "sec_2",
        targetAcademicYearId: "ay_2026",
        targetClassId: "cls_4",
        targetSectionId: null,
        decision: "CLASS_JUMP",
        reason: "Consistently scoring top of class across every subject — recommended by the subject teachers.",
        status: "AWAITING_APPROVAL",
        decidedById: "usr_incharge_1",
        decidedAt: "2026-09-10T09:00:00",
      },
    ]
  : [];
