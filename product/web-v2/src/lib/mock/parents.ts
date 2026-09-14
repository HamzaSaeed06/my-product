export interface ParentChildLink {
  linkId: string;
  studentId: string;
  relationship: string | null;
  isPrimary: boolean;
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  children: ParentChildLink[];
}

// Many-to-many with Student via a join carrying relationship + isPrimary
// — a parent can have several children, a student can have several
// guardians. studentIds below reference the Phase A mock students.
export const mockParents: Parent[] = [
  {
    id: "par_1",
    fullName: "Ahmed Khan",
    phone: "0300-1112233",
    email: "ahmed.khan@example.com",
    address: "House 12, Model Town, Lahore",
    children: [
      { linkId: "pc_1", studentId: "stu_0001", relationship: "Father", isPrimary: true },
      { linkId: "pc_2", studentId: "stu_0002", relationship: "Father", isPrimary: true },
    ],
  },
  {
    id: "par_2",
    fullName: "Nadia Farooq",
    phone: "0301-4445566",
    email: "nadia.farooq@example.com",
    address: "Flat 4B, Gulberg, Lahore",
    children: [{ linkId: "pc_3", studentId: "stu_0003", relationship: "Mother", isPrimary: true }],
  },
  {
    id: "par_3",
    fullName: "Imran Sheikh",
    phone: "0302-7778899",
    email: null,
    address: null,
    children: [],
  },
  // The Portal batch's demo parent — deliberately linked to two of sec_2's
  // real roster students so the Parent/Student portal pages show real
  // attendance/results/invoices already seeded for that section, rather
  // than an empty state. stu_0191 (PUBLISHED result, a report card) is
  // the default active child, good for Results/Report Card; stu_0148
  // (FINALIZED-but-not-published, an UNPAID invoice) is the second child
  // — switch to them to see the Fees pay-online flow instead.
  {
    id: "par_4",
    fullName: "Shahzad Iqbal",
    phone: "0303-9988776",
    email: "shahzad.iqbal@example.com",
    address: "House 7, Johar Town, Lahore",
    children: [
      { linkId: "pc_4", studentId: "stu_0191", relationship: "Father", isPrimary: true },
      { linkId: "pc_5", studentId: "stu_0148", relationship: "Father", isPrimary: true },
    ],
  },
];
