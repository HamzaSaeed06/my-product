import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const resultsRouter = Router();

resultsRouter.get("/", ...requirePermission("result.view"), asyncHandler(controller.getOrCreateResultsHandler));
resultsRouter.get("/:resultId", ...requirePermission("result.view"), asyncHandler(controller.getResultHandler));

resultsRouter.post(
  "/:resultId/items",
  ...requirePermission("result.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.enterResultItemHandler)
);

resultsRouter.post(
  "/:resultId/submit",
  ...requirePermission("result.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.submitResultHandler)
);

resultsRouter.post(
  "/:resultId/review",
  ...requirePermission("result.review"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.reviewResultHandler)
);

resultsRouter.post(
  "/:resultId/finalize",
  ...requirePermission("result.finalize"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.finalizeResultHandler)
);

resultsRouter.post(
  "/:resultId/publish",
  ...requirePermission("result.publish"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.publishResultHandler)
);

resultsRouter.post(
  "/items/:itemId/request-correction",
  ...requirePermission("result.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.requestResultCorrectionHandler)
);

resultsRouter.post(
  "/corrections/:approvalId/decide",
  ...requirePermission("result.correct"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideResultCorrectionHandler)
);
