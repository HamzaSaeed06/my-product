import type { Request, Response } from "express";
import * as service from "./service.js";

export async function getDashboardSummaryHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getDashboardSummary());
}
