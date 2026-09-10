import type { Request, Response } from "express";
import { z } from "zod";
import * as auditService from "./service.js";

const querySchema = z.object({
  actorId: z.string().optional(),
  resource: z.string().optional(),
  recordId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  cursor: z.string().optional(),
});

export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const query = querySchema.parse(req.query);
  res.status(200).json(await auditService.listAuditLogs(query));
}
