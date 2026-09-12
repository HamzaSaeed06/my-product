import { prisma } from "./prisma.js";
import { getLicenseInfo } from "./license.js";
import { HttpError } from "../middleware/errorHandler.js";

// PRODUCT_SPEC.md §2's own worked example: "if studentCount >
// license.limits.maxStudents -> BLOCK new student creation, SHOW upgrade
// required." Was previously declared in every License JWT but never
// actually checked anywhere — this is that check, wired into the one real
// creation entry point for each resource. Same permissive-by-default
// philosophy as licenseGate.ts: no license configured (a local/dev
// instance, state NOT_CONFIGURED) means no limit. A request that reaches
// this far can never be in an EXPIRED_GRACE/EXPIRED_FINAL/INVALID state
// either — licenseWriteGate already blocks every non-safe-method request
// in those states before any service function runs.
const LABELS: Record<"maxStudents" | "maxCampuses" | "maxStaff", string> = {
  maxStudents: "students",
  maxCampuses: "campuses",
  maxStaff: "staff",
};

async function assertUnderLimit(resource: "maxStudents" | "maxCampuses" | "maxStaff", currentCount: number): Promise<void> {
  const { claims } = getLicenseInfo();
  if (!claims) return;

  const limit = claims.limits[resource];
  if (currentCount >= limit) {
    throw new HttpError(
      403,
      "LICENSE_LIMIT_REACHED",
      `This license allows at most ${limit} ${LABELS[resource]}. Upgrade the plan to add more.`
    );
  }
}

export async function assertStudentLimit(): Promise<void> {
  const count = await prisma.student.count({ where: { status: "ACTIVE" } });
  await assertUnderLimit("maxStudents", count);
}

export async function assertCampusLimit(): Promise<void> {
  const count = await prisma.campus.count({ where: { archivedAt: null } });
  await assertUnderLimit("maxCampuses", count);
}

export async function assertStaffLimit(): Promise<void> {
  const count = await prisma.teacher.count({ where: { status: "ACTIVE" } });
  await assertUnderLimit("maxStaff", count);
}

// Storage is measured, not counted — the actual sum of every stored
// document's real byte size (Document.sizeBytes), compared against the
// license's maxStorage (MB). additionalBytes is the file about to be
// saved; the caller passes it BEFORE writing the DB record (documents/
// service.ts also has to undo the disk write if this throws, since
// multer already saved the file by the time this runs).
export async function assertStorageLimit(additionalBytes: number): Promise<void> {
  const { claims } = getLicenseInfo();
  if (!claims) return;

  const totalBytes = await prisma.document.aggregate({ _sum: { sizeBytes: true } });
  const currentBytes = Number(totalBytes._sum.sizeBytes ?? 0);
  const limitBytes = claims.limits.maxStorage * 1024 * 1024;

  if (currentBytes + additionalBytes > limitBytes) {
    throw new HttpError(
      403,
      "LICENSE_STORAGE_LIMIT_REACHED",
      `This license allows ${claims.limits.maxStorage}MB of document storage, which is now full. Upgrade the plan or remove old documents.`
    );
  }
}
