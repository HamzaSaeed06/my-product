import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";

export const auditRouter = Router();

// Read-only by design — audit logs are immutable (PRODUCT_SPEC.md §7/§8):
// no create/update/delete routes exist or ever should.
auditRouter.get("/", ...requirePermission("audit.view"), asyncHandler(controller.listAuditLogsHandler));
