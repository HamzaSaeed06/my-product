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
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { readRateLimiter } from "./middleware/rateLimiter.js";

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
  app.use(express.json({ limit: "1mb" }));
  app.use(readRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
