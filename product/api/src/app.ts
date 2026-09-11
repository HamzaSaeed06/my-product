import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { rolesRouter, permissionsRouter } from "./modules/roles/routes.js";
import { approvalsRouter } from "./modules/approvals/routes.js";
import { documentsRouter } from "./modules/documents/routes.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { auditRouter } from "./modules/audit/routes.js";
import { instituteRouter } from "./modules/institute/routes.js";
import { campusesRouter } from "./modules/campuses/routes.js";
import { academicYearsRouter } from "./modules/academic-years/routes.js";
import { classesRouter } from "./modules/classes/routes.js";
import { sectionsRouter } from "./modules/sections/routes.js";
import { inchargeScopesRouter } from "./modules/incharge-scopes/routes.js";
import { studentsRouter } from "./modules/students/routes.js";
import { parentsRouter } from "./modules/parents/routes.js";
import { teachersRouter } from "./modules/teachers/routes.js";
import { subjectsRouter } from "./modules/subjects/routes.js";
import { admissionsRouter } from "./modules/admissions/routes.js";
import { enrollmentsRouter } from "./modules/enrollments/routes.js";
import { teacherAssignmentsRouter } from "./modules/teacher-assignments/routes.js";
import { timetableRouter } from "./modules/timetable/routes.js";
import { attendanceRouter } from "./modules/attendance/routes.js";
import { teacherAttendanceRouter } from "./modules/teacher-attendance/routes.js";
import { substitutionsRouter } from "./modules/substitutions/routes.js";
import { curriculumRouter } from "./modules/curriculum/routes.js";
import { homeworkRouter } from "./modules/homework/routes.js";
import { assessmentsRouter } from "./modules/assessments/routes.js";
import { examsRouter } from "./modules/exams/routes.js";
import { examSchedulesRouter } from "./modules/exam-schedules/routes.js";
import { resultsRouter } from "./modules/results/routes.js";
import { reportCardsRouter } from "./modules/report-cards/routes.js";
import { promotionsRouter } from "./modules/promotions/routes.js";
import { feeCategoriesRouter } from "./modules/fee-categories/routes.js";
import { feeStructuresRouter } from "./modules/fee-structures/routes.js";
import { studentFeesRouter } from "./modules/student-fees/routes.js";
import { invoicesRouter } from "./modules/invoices/routes.js";
import { paymentsRouter } from "./modules/payments/routes.js";
import { refundsRouter } from "./modules/refunds/routes.js";
import { discountsRouter } from "./modules/discounts/routes.js";
import { waiversRouter } from "./modules/waivers/routes.js";
import { cashClosingRouter } from "./modules/cash-closing/routes.js";
import { leavesRouter } from "./modules/leaves/routes.js";
import { complaintsRouter } from "./modules/complaints/routes.js";
import { reportsRouter } from "./modules/reports/routes.js";
import { paymentGatewaysRouter } from "./modules/payment-gateways/routes.js";
import { onlinePaymentRouter, paymentCallbackRouter, paymentReconciliationRouter } from "./modules/online-payment/routes.js";
import { licenseRouter } from "./modules/license/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { readRateLimiter } from "./middleware/rateLimiter.js";
import { licenseWriteGate } from "./middleware/licenseGate.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_APP_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  // The `verify` callback stashes the exact raw bytes on the request
  // before JSON-parsing them — the payment-callback webhook route needs
  // these to verify an HMAC signature (which is computed over the raw
  // body, not a re-serialized JSON.stringify of the parsed object; the
  // two aren't guaranteed byte-identical, e.g. key ordering). Every
  // other route ignores req.rawBody entirely — this is a no-op for them.
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(readRateLimiter);
  // Phase 10: blocks non-safe-method requests once the license is
  // expired/invalid, per PRODUCT_SPEC.md §2's grace-period rules. Mounted
  // globally, ahead of every module router, so no route needs to remember
  // to add it individually — the exemptions (auth, license status, health)
  // live inside the gate itself.
  app.use(licenseWriteGate);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/v1/license", licenseRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/roles", rolesRouter);
  app.use("/api/v1/permissions", permissionsRouter);
  app.use("/api/v1/approvals", approvalsRouter);
  app.use("/api/v1/documents", documentsRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/institute", instituteRouter);
  app.use("/api/v1/campuses", campusesRouter);
  app.use("/api/v1/academic-years", academicYearsRouter);
  app.use("/api/v1/classes", classesRouter);
  app.use("/api/v1/sections", sectionsRouter);
  app.use("/api/v1/incharge-scopes", inchargeScopesRouter);
  app.use("/api/v1/students", studentsRouter);
  app.use("/api/v1/parents", parentsRouter);
  app.use("/api/v1/teachers", teachersRouter);
  app.use("/api/v1/subjects", subjectsRouter);
  app.use("/api/v1/admissions", admissionsRouter);
  app.use("/api/v1/enrollments", enrollmentsRouter);
  app.use("/api/v1/teacher-assignments", teacherAssignmentsRouter);
  app.use("/api/v1/timetables", timetableRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/teacher-attendance", teacherAttendanceRouter);
  app.use("/api/v1/substitutions", substitutionsRouter);
  app.use("/api/v1/curriculum", curriculumRouter);
  app.use("/api/v1/homework", homeworkRouter);
  app.use("/api/v1/assessments", assessmentsRouter);
  app.use("/api/v1/exams", examsRouter);
  app.use("/api/v1/exam-schedules", examSchedulesRouter);
  app.use("/api/v1/results", resultsRouter);
  app.use("/api/v1/report-cards", reportCardsRouter);
  app.use("/api/v1/promotions", promotionsRouter);
  app.use("/api/v1/fee-categories", feeCategoriesRouter);
  app.use("/api/v1/fee-structures", feeStructuresRouter);
  app.use("/api/v1/student-fees", studentFeesRouter);
  app.use("/api/v1/invoices", invoicesRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/refunds", refundsRouter);
  app.use("/api/v1/discounts", discountsRouter);
  app.use("/api/v1/waivers", waiversRouter);
  app.use("/api/v1/cash-closing", cashClosingRouter);
  app.use("/api/v1/leaves", leavesRouter);
  app.use("/api/v1/complaints", complaintsRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/payment-gateways", paymentGatewaysRouter);
  app.use("/api/v1/online-payment", onlinePaymentRouter);
  app.use("/api/v1/payment-callback", paymentCallbackRouter);
  app.use("/api/v1/payment-reconciliation", paymentReconciliationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
