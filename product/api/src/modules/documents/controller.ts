import type { Request, Response } from "express";
import { z } from "zod";
import * as documentsService from "./service.js";
import { getUserPermissionKeys } from "../../middleware/authorize.js";
import { HttpError } from "../../middleware/errorHandler.js";

const uploadMetaSchema = z.object({
  category: z.string().max(100).optional(),
  isSensitive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  ownerType: z.string().max(100).optional(),
  ownerId: z.string().max(100).optional(),
});

const listQuerySchema = z.object({
  ownerType: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function uploadDocumentHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new HttpError(400, "NO_FILE", "No file uploaded (expected multipart field 'file')");
  }
  const meta = uploadMetaSchema.parse(req.body);
  const document = await documentsService.createDocumentRecord(req.file, meta, req.user!.id);
  res.status(201).json(document);
}

export async function listDocumentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const permissionKeys = await getUserPermissionKeys(req.user!.id);
  const documents = await documentsService.listDocuments(query, permissionKeys);
  res.status(200).json(documents);
}

export async function downloadDocumentHandler(req: Request, res: Response): Promise<void> {
  const permissionKeys = await getUserPermissionKeys(req.user!.id);
  const document = await documentsService.getDocumentForDownload(req.params.documentId!, permissionKeys);
  res.download(document.storagePath, document.originalName);
}
