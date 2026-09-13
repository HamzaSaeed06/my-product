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
];
