import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const customersRouter = Router();

customersRouter.get("/", authenticate, asyncHandler(controller.listCustomersHandler));
customersRouter.get("/:customerId", authenticate, asyncHandler(controller.getCustomerHandler));

customersRouter.post("/", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.createCustomerHandler));
customersRouter.patch("/:customerId", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.updateCustomerHandler));
customersRouter.post(
  "/:customerId/status",
  authenticate,
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setCustomerStatusHandler)
);
