import { prisma } from "./prisma.js";

const PREFIX = "STU-";
const DIGITS = 8;

// Permanent, human-readable student identity (spec: "STU-00018427", never
// reused, never changes). Derived from the highest existing numeric suffix
// + 1 — no dedicated sequence table, since admission volume is low-frequency
// enough that a P2002-retry (see createStudent) covers the rare race.
//
// Matched with a strict regex, not a plain `ORDER BY studentCode DESC`: test
// fixtures across the suite set human-readable, non-numeric-suffix
// studentCodes (e.g. "STU-LEAVE-<suffix>", "STU-PROMO-<suffix>"), which sort
// lexicographically above any real "STU-########" code. A single such row
// left behind by an interrupted cleanup previously broke every subsequent
// student creation (parseInt on a non-numeric suffix -> NaN -> the same
// colliding code returned on every attempt, exhausting the P2002 retry loop).
export async function generateStudentCode(): Promise<string> {
  const [last] = await prisma.$queryRaw<{ studentCode: string }[]>`
    SELECT "studentCode" FROM "students"
    WHERE "studentCode" ~ '^STU-[0-9]{8}$'
    ORDER BY "studentCode" DESC
    LIMIT 1
  `;

  const lastNumber = last ? parseInt(last.studentCode.slice(PREFIX.length), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

  return `${PREFIX}${String(next).padStart(DIGITS, "0")}`;
}
