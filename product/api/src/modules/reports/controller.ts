import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getUserPermissionKeys } from "../../middleware/authorize.js";
import { HttpError } from "../../middleware/errorHandler.js";

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
  const report = await service.getAcademicReport(query);
  sendCsvOrJson(req, res, report.studentPerformance, report);
}

export async function getAttendanceReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema
    .extend({ sectionId: z.string().uuid().optional(), classId: z.string().uuid().optional(), format: z.enum(["csv"]).optional() })
    .parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const report = await service.getAttendanceReport(query);
  sendCsvOrJson(req, res, report.studentWise, report);
}

export async function getFinancialReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema.extend({ format: z.enum(["csv"]).optional() }).parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const report = await service.getFinancialReport(query);
  sendCsvOrJson(req, res, report.dailyCollection, report);
}

export async function getAdmissionReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema
    .extend({ academicYearId: z.string().uuid().optional(), format: z.enum(["csv"]).optional() })
    .parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const report = await service.getAdmissionReport(query);
  sendCsvOrJson(req, res, report.classCapacity, report);
}

export async function getStaffReportHandler(req: Request, res: Response): Promise<void> {
  const query = dateRangeSchema.extend({ format: z.enum(["csv"]).optional() }).parse(req.query);
  if (query.format === "csv") await assertExportAllowed(req.user!.id);
  const report = await service.getStaffReport(query);
  sendCsvOrJson(req, res, report.teacherWorkload, report);
}
