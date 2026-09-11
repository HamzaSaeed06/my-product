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
