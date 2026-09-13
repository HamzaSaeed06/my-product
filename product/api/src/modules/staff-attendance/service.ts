import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { getTodayQrToken, verifyQrToken } from "../../lib/staffAttendanceQr.js";
import { isUnrestricted, type ActorProfile } from "../../lib/scope.js";
import { resolveFeatureConfig } from "../../lib/featureConfig.js";
import type { StaffCheckInMethod } from "@prisma/client";

// Phase 12 Gap 3's concrete proof of the generic FeatureConfig system:
// which check-in methods this institute (optionally narrowed per campus)
// actually allows. Seeded INSTITUTE_DEFAULT with every method allowed at
// institute-creation time (institute/service.ts), so this is a no-op for
// every institute that never touches the setting.
async function assertCheckInMethodAllowed(campusId: string, method: StaffCheckInMethod): Promise<void> {
  const institute = await prisma.institute.findFirstOrThrow();
  const resolved = await resolveFeatureConfig(institute.id, campusId, "ATTENDANCE_CHECKIN_METHODS");
  const allowedMethods = (resolved.value as { allowedMethods?: string[] })?.allowedMethods ?? [];
  if (!allowedMethods.includes(method)) {
    throw new HttpError(403, "CHECKIN_METHOD_NOT_ALLOWED", `'${method}' check-in is not allowed at this campus`);
  }
}

function include() {
  return { user: true, campus: true, markedBy: true } as const;
}

function todayDateOnly(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function getQrDisplayToken(campusId: string) {
  return { campusId, token: getTodayQrToken(campusId), date: todayDateOnly().toISOString().slice(0, 10) };
}

async function assertNotAlreadyCheckedIn(userId: string, date: Date): Promise<void> {
  const existing = await prisma.staffAttendance.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) throw new HttpError(409, "ALREADY_CHECKED_IN", "Already checked in for today");
}

export async function checkInViaQr(
  input: { campusId: string; token: string; ipAddress?: string; geoLat?: number; geoLng?: number },
  actorId: string
) {
  if (!verifyQrToken(input.campusId, input.token)) {
    throw new HttpError(400, "INVALID_QR_TOKEN", "This QR code is invalid or has expired — ask for a fresh one");
  }
  await assertCheckInMethodAllowed(input.campusId, "QR");
  const date = todayDateOnly();
  await assertNotAlreadyCheckedIn(actorId, date);

  const attendance = await prisma.staffAttendance.create({
    data: {
      userId: actorId,
      campusId: input.campusId,
      date,
      checkInAt: new Date(),
      checkInMethod: "QR",
      verifiedStatus: "VERIFIED",
      ipAddress: input.ipAddress,
      geoLat: input.geoLat,
      geoLng: input.geoLng,
    },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CHECK_IN", resource: "StaffAttendance", recordId: attendance.id, newValue: { method: "QR", campusId: input.campusId } });

  return attendance;
}

// "Manual fallback, always available" — Campus Head/Incharge marks
// someone else present because their phone/camera isn't usable. Recorded
// as MANUAL_OVERRIDE, never silently treated as self-verified.
export async function markStaffAttendance(input: { targetUserId: string; campusId: string }, actorId: string) {
  await assertCheckInMethodAllowed(input.campusId, "MANUAL");
  const date = todayDateOnly();
  await assertNotAlreadyCheckedIn(input.targetUserId, date);

  const attendance = await prisma.staffAttendance.create({
    data: {
      userId: input.targetUserId,
      campusId: input.campusId,
      date,
      checkInAt: new Date(),
      checkInMethod: "MANUAL",
      verifiedStatus: "MANUAL_OVERRIDE",
      markedById: actorId,
    },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CHECK_IN", resource: "StaffAttendance", recordId: attendance.id, newValue: { method: "MANUAL", targetUserId: input.targetUserId } });

  return attendance;
}

// "Staff genuinely working from home... a deliberate decision the system
// logs, never a silent bypass" — Campus Head grants this per day, on the
// record, treated as VERIFIED for the financial-action gate.
export async function grantRemoteApproved(input: { targetUserId: string; campusId: string }, actorId: string) {
  await assertCheckInMethodAllowed(input.campusId, "REMOTE_APPROVED");
  const date = todayDateOnly();
  await assertNotAlreadyCheckedIn(input.targetUserId, date);

  const attendance = await prisma.staffAttendance.create({
    data: {
      userId: input.targetUserId,
      campusId: input.campusId,
      date,
      checkInAt: new Date(),
      checkInMethod: "REMOTE_APPROVED",
      verifiedStatus: "VERIFIED",
      markedById: actorId,
    },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CHECK_IN", resource: "StaffAttendance", recordId: attendance.id, newValue: { method: "REMOTE_APPROVED", targetUserId: input.targetUserId } });

  return attendance;
}

// The financial-action gate's underlying check — VERIFIED (QR or
// REMOTE_APPROVED) or MANUAL_OVERRIDE all count, per the design's explicit
// "has this user checked in today (VERIFIED or MANUAL_OVERRIDE)?" rule.
export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const attendance = await prisma.staffAttendance.findUnique({ where: { userId_date: { userId, date: todayDateOnly() } } });
  return !!attendance;
}

// The design's "financial-action gate, not a network/IP lock": applied so
// far only to recording a cash payment (payments/controller.ts), the one
// action explicitly named in docs/PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md's
// A3 design text ("record a payment or fee action"). Extending it to other
// Office fee-actions (invoice creation, fee assignment, discount/waiver
// requests, ...) is a reasonable follow-up but wasn't blanket-applied here
// — each of those is an existing, working write path, and locking all of
// them behind a brand-new daily check-in requirement without the user
// confirming that's actually wanted risks breaking real usage rather than
// improving it. SUPER_ADMIN is exempt — it's institute-wide and unscoped,
// with no campus-attendance concept that applies to it at all.
export async function assertCheckedInTodayForFinancialAction(profile: ActorProfile, actorId: string): Promise<void> {
  if (isUnrestricted(profile)) return;
  if (await hasCheckedInToday(actorId)) return;
  throw new HttpError(
    403,
    "NOT_CHECKED_IN_TODAY",
    "You must check in for today (QR, or ask your Campus Head/Incharge to mark you) before recording a payment"
  );
}

export async function listStaffAttendance(filter: { campusId?: string; campusIdIn?: string[]; date?: string; userId?: string }) {
  return prisma.staffAttendance.findMany({
    where: {
      campusId: filter.campusId ?? (filter.campusIdIn ? { in: filter.campusIdIn } : undefined),
      date: filter.date ? new Date(filter.date) : undefined,
      userId: filter.userId,
    },
    include: include(),
    orderBy: { date: "desc" },
  });
}
