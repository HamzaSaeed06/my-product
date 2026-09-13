import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";

export const reportsRouter = Router();

reportsRouter.get("/academic", ...requirePermission("report.view_academic"), asyncHandler(controller.getAcademicReportHandler));
reportsRouter.get("/attendance", ...requirePermission("report.view_attendance"), asyncHandler(controller.getAttendanceReportHandler));
reportsRouter.get("/financial", ...requirePermission("report.view_financial"), asyncHandler(controller.getFinancialReportHandler));
reportsRouter.get("/admissions", ...requirePermission("report.view_admissions"), asyncHandler(controller.getAdmissionReportHandler));
reportsRouter.get("/staff", ...requirePermission("report.view_staff"), asyncHandler(controller.getStaffReportHandler));
// Super Admin's cross-campus monitoring view — deliberately its own
// permission (institute.monitor), not one of the report.view_X keys above,
// since it's not a "report" in the Report Center's sense (no date range,
// no export) and is meant to stay Super-Admin-only per
// docs/PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md Phase A.
reportsRouter.get("/institute-overview", ...requirePermission("institute.monitor"), asyncHandler(controller.getInstituteOverviewHandler));
