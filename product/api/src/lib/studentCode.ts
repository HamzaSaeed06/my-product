import { prisma } from "./prisma.js";

const PREFIX = "STU-";
const DIGITS = 8;

// Permanent, human-readable student identity (spec: "STU-00018427", never
// reused, never changes). Derived from the highest existing numeric suffix
// + 1 — no dedicated sequence table, since admission volume is low-frequency
// enough that a P2002-retry (see createStudent) covers the rare race.
export async function generateStudentCode(): Promise<string> {
  const last = await prisma.student.findFirst({
    orderBy: { studentCode: "desc" },
    select: { studentCode: true },
  });

  const lastNumber = last ? parseInt(last.studentCode.slice(PREFIX.length), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

  return `${PREFIX}${String(next).padStart(DIGITS, "0")}`;
}
