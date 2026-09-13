import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getUserPermissionKeys } from "../../middleware/authorize.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { getActorProfile, assertCampusInScope, assertSectionInScope, type ActorProfile } from "../../lib/scope.js";

// Every report below took an optional single `campusId` with zero scope
// enforcement — a Campus Head/Office could pass any campus's id (or omit
// it entirely, for Financial/Admission/Staff/Attendance, to see the whole
// institute's aggregate). This resolves it once per report: a specific
// requested campusId is verified in-scope; omitted defaults to the
// actor's own campus. Known limitation, called out rather than silently
// glossed over: a user with >1 campus (Phase 11's documented "one person
// overseeing 2 campuses" edge case) defaults to their first — comparing
// across their own campuses in one report view isn't built, same as
// Super Admin's Institute Overview is the only cross-campus view that
// exists today.
function resolveReportCampusId(profile: ActorProfile, requestedCampusId: string | undefined): string | undefined {
  if (profile.campusIds.length === 0) return requestedCampusId;
  if (requestedCampusId) {
    assertCampusInScope(profile, requestedCampusId);
    return requestedCampusId;
  }
  return profile.campusIds[0];
}

const dateRangeSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  campusId: z.string().uuid().optional(),
});

// Export is gated by a SEPARATE permission (report.export) from viewing —
// spec's explicit rule ("Security: Export authorization enforces same data
// scope as viewing... Permissions: Separate view vs export permissions").
// A role with only report.view_X can see the report on screen but not
// pull a CSV of it.
async function assertExportAllowed(userId: string) {
  const keys = await getUserPermissionKeys(userId);
  if (!keys.has("report.export")) {
    throw new HttpError(403, "EXPORT_NOT_ALLOWED", "You do not have permission to export reports");
  }
}

function sendCsvOrJson(req: Request, res: Response, primaryRows: Record<string, unknown>[], fullPayload: unknown) {
  if (req.query.format === "csv") {
    const csv = service.toCsv(primaryRows);
    res.status(200).set("Content-Type", "text/csv").set("Content-Disposition", "attachment; filename=report.csv").send(csv);
    return;
  }
  res.status(200).json(fullPayload);
}

const academicQuerySchema = z.object({
  examId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  format: z.enum(["csv"]).optional(),
});

export async function getAcademicReportHandler(req: Request, res: Response): Promise<void> {
  const query = academicQuerySchema.parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const profile = await getActorProfile(req.user!.id);
  if (query.sectionId) await assertSectionInScope(profile, query.sectionId);
  const campusIdIn = !query.sectionId && profile.campusIds.length > 0 ? profile.campusIds : undefined;
  const report = await service.getAcademicReport({ ...query, campusIdIn });
  sendCsvOrJson(req, res, report.studentPerformance, report);
}

export async function getAttendanceReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema
    .extend({ sectionId: z.string().uuid().optional(), classId: z.string().uuid().optional(), format: z.enum(["csv"]).optional() })
    .parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const profile = await getActorProfile(req.user!.id);
  // A specific sectionId already fully determines correctness on its own
  // (verified in-scope below) — only resolve/default campusId when no
  // section was named, so a multi-campus actor picking a section from
  // their 2nd campus doesn't get overridden by a campusId defaulted to
  // their 1st.
  let campusId = query.campusId;
  if (query.sectionId) {
    await assertSectionInScope(profile, query.sectionId);
  } else {
    campusId = resolveReportCampusId(profile, query.campusId);
  }
  const report = await service.getAttendanceReport({ ...query, campusId });
  sendCsvOrJson(req, res, report.studentWise, report);
}

export async function getFinancialReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema.extend({ format: z.enum(["csv"]).optional() }).parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const profile = await getActorProfile(req.user!.id);
  const campusId = resolveReportCampusId(profile, query.campusId);
  const report = await service.getFinancialReport({ ...query, campusId });
  sendCsvOrJson(req, res, report.dailyCollection, report);
}

export async function getAdmissionReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema
    .extend({ academicYearId: z.string().uuid().optional(), format: z.enum(["csv"]).optional() })
    .parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const profile = await getActorProfile(req.user!.id);
  const campusId = resolveReportCampusId(profile, query.campusId);
  const report = await service.getAdmissionReport({ ...query, campusId });
  sendCsvOrJson(req, res, report.classCapacity, report);
}

export async function getStaffReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema.extend({ format: z.enum(["csv"]).optional() }).parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const profile = await getActorProfile(req.user!.id);
  const campusId = resolveReportCampusId(profile, query.campusId);
  const report = await service.getStaffReport({ ...query, campusId });
  sendCsvOrJson(req, res, report.teacherWorkload, report);
}

export async function getInstituteOverviewHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getInstituteOverview());
}
