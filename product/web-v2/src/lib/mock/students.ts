export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED";
export type FeeStatus = "PAID" | "DUE" | "OVERDUE";

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
  dateOfBirth: string;
  // NADRA's child-registration number (a CNIC equivalent for minors) —
  // unlike CNIC, most young children don't have one yet, so this stays
  // optional rather than required like Parent.cnic.
  bForm: string | null;
  campusId: string;
  campusName: string;
  className: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  status: StudentStatus;
  feeStatus: FeeStatus;
  attendancePct: number;
  admittedOn: string;
}

const CAMPUSES: [string, string][] = [
  ["cmp_main", "Main Campus"],
  ["cmp_north", "North Town Campus"],
  ["cmp_riverside", "Riverside Campus"],
  ["cmp_hilltop", "Hilltop Campus"],
];

const CLASSES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
const SECTIONS = ["A", "B", "C"];
const FIRST_NAMES = ["Ali", "Sara", "Hamza", "Ayesha", "Bilal", "Zara", "Usman", "Mahnoor", "Hassan", "Fatima", "Omar", "Amna", "Talha", "Iqra", "Danish", "Hira"];
const LAST_NAMES = ["Khan", "Ahmed", "Malik", "Raza", "Iqbal", "Farooq", "Shah", "Butt", "Chaudhry", "Sheikh"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const STATUS_WEIGHTS: StudentStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "GRADUATED"];
const FEE_WEIGHTS: FeeStatus[] = ["PAID", "PAID", "PAID", "DUE", "DUE", "OVERDUE"];

export const mockStudents: Student[] = Array.from({ length: 214 }, (_, i) => {
  const [campusId, campusName] = pick(CAMPUSES);
  const admittedYear = 2019 + Math.floor(rand() * 7);
  const admittedMonth = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
  const className = pick(CLASSES);
  // Roughly consistent age-for-grade (Grade 1 ~ 6yo, Grade 8 ~ 13yo) so
  // duplicate-detection demos (name + DOB match) look plausible rather
  // than random.
  const age = CLASSES.indexOf(className) + 6;
  const birthYear = 2026 - age;
  const birthMonth = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
  const birthDay = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
  // Not every child has a B-Form yet (newborns especially) — leaving a
  // realistic fraction null keeps the "optional" duplicate-check path
  // exercised, not just the happy path.
  const hasBForm = rand() < 0.7;
  const bForm = hasBForm
    ? `${10000 + Math.floor(rand() * 89999)}-${1000000 + Math.floor(rand() * 8999999)}-${Math.floor(rand() * 9)}`
    : null;
  return {
    id: `stu_${String(i + 1).padStart(4, "0")}`,
    admissionNo: `${admittedYear}-${String(1000 + i)}`,
    fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
    bForm,
    campusId,
    campusName,
    className,
    section: pick(SECTIONS),
    guardianName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    guardianPhone: `03${Math.floor(rand() * 90000000 + 10000000)}`,
    status: pick(STATUS_WEIGHTS),
    feeStatus: pick(FEE_WEIGHTS),
    attendancePct: Math.round(78 + rand() * 21),
    admittedOn: `${admittedYear}-${admittedMonth}-01`,
  };
});

export function getStudentById(id: string): Student | undefined {
  return mockStudents.find((s) => s.id === id);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeBForm(bForm: string): string {
  return bForm.replace(/[^0-9]/g, "");
}

// Deliberately a warning, not a block: two siblings (or two unrelated
// children) can legitimately share a name, and twins can share a DOB.
// B-Form is the one field that's a genuine unique-identity match when
// present on both sides — name+DOB together is a much weaker "possible
// match," surfaced so a human decides, never auto-merged.
export function findPotentialDuplicateStudents(fullName: string, dateOfBirth: string, bForm?: string | null): Student[] {
  const normalizedName = normalizeName(fullName);
  const normalizedBForm = bForm ? normalizeBForm(bForm) : null;
  if (!normalizedName || !dateOfBirth) return [];
  return mockStudents.filter((s) => {
    if (normalizedBForm && s.bForm && normalizeBForm(s.bForm) === normalizedBForm) return true;
    return normalizeName(s.fullName) === normalizedName && s.dateOfBirth === dateOfBirth;
  });
}
