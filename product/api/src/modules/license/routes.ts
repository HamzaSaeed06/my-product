import { Router } from "express";
import * as controller from "./controller.js";

export const licenseRouter = Router();

licenseRouter.get("/", controller.getLicenseStatusHandler);
