import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireRole } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const customersRouter = Router();

customersRouter.get(
  "/",
  ...requireRole("ADMIN", "SUPPORT_READ_ONLY"),
  asyncHandler(controller.listCustomersHandler)
);
customersRouter.get(
  "/:customerId",
  ...requireRole("ADMIN", "SUPPORT_READ_ONLY"),
  asyncHandler(controller.getCustomerHandler)
);

customersRouter.post(
  "/",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createCustomerHandler)
);
customersRouter.patch(
  "/:customerId",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateCustomerHandler)
);
customersRouter.post(
  "/:customerId/status",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setCustomerStatusHandler)
);
