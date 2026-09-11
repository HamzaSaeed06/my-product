import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", authenticate, asyncHandler(controller.getDashboardSummaryHandler));
