export interface ParentChildLink {
  linkId: string;
  studentId: string;
  relationship: string | null;
  isPrimary: boolean;
}

export interface Parent {
  id: string;
  fullName: string;
  // Required and unique — the one reliable identity check for adults, so a
  // second child from the same family gets linked to this same Parent
  // record instead of a duplicate one being created for each sibling.
  cnic: string;
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
    cnic: "35202-1234567-1",
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
    cnic: "35201-7654321-2",
    phone: "0301-4445566",
    email: "nadia.farooq@example.com",
    address: "Flat 4B, Gulberg, Lahore",
    children: [{ linkId: "pc_3", studentId: "stu_0003", relationship: "Mother", isPrimary: true }],
  },
  {
    id: "par_3",
    fullName: "Imran Sheikh",
    cnic: "42101-9988776-3",
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
    cnic: "35202-5544332-4",
    phone: "0303-9988776",
    email: "shahzad.iqbal@example.com",
    address: "House 7, Johar Town, Lahore",
    children: [
      { linkId: "pc_4", studentId: "stu_0191", relationship: "Father", isPrimary: true },
      { linkId: "pc_5", studentId: "stu_0148", relationship: "Father", isPrimary: true },
    ],
  },
];

function normalizeCnic(cnic: string): string {
  return cnic.replace(/[^0-9]/g, "");
}

export function findParentByCnic(cnic: string): Parent | undefined {
  const normalized = normalizeCnic(cnic);
  if (normalized.length < 13) return undefined;
  return mockParents.find((p) => normalizeCnic(p.cnic) === normalized);
}
