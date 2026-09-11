import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const reportCardsRouter = Router();

reportCardsRouter.get("/", ...requirePermission("report_card.view"), asyncHandler(controller.listReportCardsHandler));
reportCardsRouter.get("/:reportCardId", ...requirePermission("report_card.view"), asyncHandler(controller.getReportCardHandler));

reportCardsRouter.post(
  "/",
  ...requirePermission("report_card.generate"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.generateReportCardHandler)
);
