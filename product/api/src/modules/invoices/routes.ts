import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const invoicesRouter = Router();

invoicesRouter.get("/", ...requirePermission("invoice.view"), asyncHandler(controller.listInvoicesHandler));
invoicesRouter.get("/:invoiceId", ...requirePermission("invoice.view"), asyncHandler(controller.getInvoiceHandler));

invoicesRouter.post(
  "/",
  ...requirePermission("invoice.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createInvoiceHandler)
);

invoicesRouter.post(
  "/:invoiceId/void",
  ...requirePermission("invoice.void"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.voidInvoiceHandler)
);
