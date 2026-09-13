export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED";
export type FeeStatus = "PAID" | "DUE" | "OVERDUE";

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
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
  return {
    id: `stu_${String(i + 1).padStart(4, "0")}`,
    admissionNo: `${admittedYear}-${String(1000 + i)}`,
    fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    campusId,
    campusName,
    className: pick(CLASSES),
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
