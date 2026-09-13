export type InquiryStatus = "NEW" | "CONTACTED" | "CLOSED" | "CONVERTED";

export interface AdmissionInquiry {
  id: string;
  campusId: string;
  /** Optional — a parent might not know which class/program yet. */
  classId: string | null;
  childName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  source: string | null;
  notes: string | null;
  status: InquiryStatus;
  convertedStudentId: string | null;
  createdAt: string;
}

// A lead before a formal Admission exists — the real backend has this
// entity and a full convert-to-admission flow, but the old frontend never
// shipped a page for it at all. NEW/CONTACTED/CLOSED are a light
// progression staff move through by hand; CONVERTED is one-way, reached
// only through the Convert flow (never a plain status change), since it
// carries convertedStudentId once the Student/Parent/Admission triple
// actually exists.
export const mockAdmissionInquiries: AdmissionInquiry[] = [
  {
    id: "inq_1",
    campusId: "cmp_main",
    classId: "cls_1",
    childName: "Zainab Malik",
    parentName: "Farhan Malik",
    parentPhone: "0300-9998877",
    parentEmail: "farhan.malik@example.com",
    source: "Walk-in",
    notes: "Interested in the morning shift.",
    status: "NEW",
    convertedStudentId: null,
    createdAt: "2026-09-12",
  },
  {
    id: "inq_2",
    campusId: "cmp_north",
    classId: null,
    childName: "Bilal Sarwar",
    parentName: "Rukhsana Sarwar",
    parentPhone: "0301-8887766",
    parentEmail: null,
    source: "Referral",
    notes: "Not sure which class yet — child is 6 years old.",
    status: "CONTACTED",
    convertedStudentId: null,
    createdAt: "2026-09-08",
  },
  {
    id: "inq_3",
    campusId: "cmp_main",
    classId: "cls_2",
    childName: "Ahsan Tariq",
    parentName: "Tariq Mehmood",
    parentPhone: "0302-7776655",
    parentEmail: "tariq.mehmood@example.com",
    source: "Website",
    notes: null,
    status: "CLOSED",
    convertedStudentId: null,
    createdAt: "2026-08-25",
  },
];
