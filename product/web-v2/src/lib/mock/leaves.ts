import { getSectionRoster } from "./sections";

export type LeaveSubjectType = "STUDENT" | "TEACHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

// subjectType is mutually exclusive with studentId/teacherId — exactly one
// of the two ids is set, matching whichever type this is. isRetrospective
// is auto-computed (fromDate already in the past) in the real backend, not
// a form field. assignedToId is auto-routed (a student leave routes to
// their section's Incharge) rather than picked by the requester.
export interface Leave {
  id: string;
  subjectType: LeaveSubjectType;
  studentId: string | null;
  teacherId: string | null;
  fromDate: string;
  toDate: string;
  reason: string;
  isRetrospective: boolean;
  status: LeaveStatus;
  requestedById: string;
  assignedToId: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

const sec2Roster = getSectionRoster("sec_2");

export const mockLeaves: Leave[] = [
  {
    id: "lv_1",
    subjectType: "STUDENT",
    studentId: sec2Roster[0]?.id ?? null,
    teacherId: null,
    fromDate: "2026-09-16",
    toDate: "2026-09-17",
    reason: "Family wedding out of town.",
    isRetrospective: false,
    status: "PENDING",
    requestedById: "usr_incharge_1",
    assignedToId: "usr_incharge_1",
    decidedById: null,
    decidedAt: null,
    decisionNote: null,
  },
  {
    id: "lv_2",
    subjectType: "STUDENT",
    studentId: sec2Roster[1]?.id ?? null,
    teacherId: null,
    fromDate: "2026-09-08",
    toDate: "2026-09-09",
    reason: "Was unwell — submitted after returning to school.",
    isRetrospective: true,
    status: "APPROVED",
    requestedById: "usr_incharge_1",
    assignedToId: "usr_incharge_1",
    decidedById: "usr_incharge_1",
    decidedAt: "2026-09-10T09:00:00",
    decisionNote: "Approved retrospectively — doctor's note on file.",
  },
  {
    id: "lv_3",
    subjectType: "TEACHER",
    studentId: null,
    teacherId: "tch_2",
    fromDate: "2026-09-20",
    toDate: "2026-09-22",
    reason: "Attending a subject-training workshop out of city.",
    isRetrospective: false,
    status: "PENDING",
    requestedById: "usr_teacher_2",
    assignedToId: "usr_head_main",
    decidedById: null,
    decidedAt: null,
    decisionNote: null,
  },
  {
    id: "lv_4",
    subjectType: "TEACHER",
    studentId: null,
    teacherId: "tch_1",
    fromDate: "2026-08-25",
    toDate: "2026-08-25",
    reason: "Personal emergency.",
    isRetrospective: false,
    status: "REJECTED",
    requestedById: "usr_teacher_1",
    assignedToId: "usr_head_main",
    decidedById: "usr_head_main",
    decidedAt: "2026-08-24T15:00:00",
    decisionNote: "Same-day notice with an exam scheduled — asked to arrange coverage instead.",
  },
];
