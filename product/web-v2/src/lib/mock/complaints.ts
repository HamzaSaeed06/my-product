import { getSectionRoster } from "./sections";

// A multi-step ticket workflow, not a simple maker-checker — confirmed
// from the real backend's own richer 5-state lifecycle plus reopen/forward.
export type ComplaintStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Complaint {
  id: string;
  studentId: string | null;
  campusId: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  submittedById: string;
  assignedToId: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface ComplaintNote {
  id: string;
  complaintId: string;
  authorId: string;
  note: string;
  createdAt: string;
}

const sec2Roster = getSectionRoster("sec_2");

export const mockComplaints: Complaint[] = [
  {
    id: "cmp_1",
    studentId: sec2Roster[2]?.id ?? null,
    campusId: "cmp_main",
    category: "Bullying",
    description: "Parent reports their child has been repeatedly teased by classmates during break time this week.",
    status: "OPEN",
    submittedById: "usr_office_1",
    assignedToId: null,
    resolutionNote: null,
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "cmp_2",
    studentId: sec2Roster[3]?.id ?? null,
    campusId: "cmp_main",
    category: "Academic",
    description: "Parent is concerned about the pace of the Mathematics curriculum this term.",
    status: "IN_PROGRESS",
    submittedById: "usr_office_1",
    assignedToId: "usr_incharge_1",
    resolutionNote: null,
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "cmp_3",
    studentId: null,
    campusId: "cmp_main",
    category: "Facilities",
    description: "General complaint about the condition of the playground equipment near Block B.",
    status: "RESOLVED",
    submittedById: "usr_office_1",
    assignedToId: "usr_head_main",
    resolutionNote: "Playground equipment inspected and repaired by the maintenance team.",
    resolvedAt: "2026-09-11T10:00:00",
    closedAt: null,
  },
];

export const mockComplaintNotes: ComplaintNote[] = [
  { id: "cn_1", complaintId: "cmp_2", authorId: "usr_incharge_1", note: "Spoke with the class teacher — she'll share the term plan with the parent directly.", createdAt: "2026-09-12T11:00:00" },
  { id: "cn_2", complaintId: "cmp_3", authorId: "usr_head_main", note: "Assigned to maintenance for inspection.", createdAt: "2026-09-09T09:00:00" },
];
