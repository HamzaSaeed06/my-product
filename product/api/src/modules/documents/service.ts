import path from "node:path";
import fs from "node:fs/promises";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { assertStorageLimit } from "../../lib/licenseLimits.js";

export interface DocumentMeta {
  category?: string;
  isSensitive?: boolean;
  ownerType?: string;
  ownerId?: string;
}

export async function createDocumentRecord(
  file: Express.Multer.File,
  meta: DocumentMeta,
  uploadedById: string
) {
  // multer's disk storage already wrote this file before this function
  // ever runs (it's middleware, ahead of the route handler) — a rejected
  // upload must delete it, or the disk keeps growing past the license's
  // storage limit even though no Document row (and no further storage)
  // is recorded for it.
  try {
    await assertStorageLimit(file.size);
  } catch (err) {
    await fs.unlink(file.path).catch(() => {});
    throw err;
  }

  const document = await prisma.document.create({
    data: {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: path.resolve(file.path),
      category: meta.category,
      isSensitive: meta.isSensitive ?? false,
      ownerType: meta.ownerType,
      ownerId: meta.ownerId,
      uploadedById,
    },
  });

  await writeAuditLog({
    actorId: uploadedById,
    action: "UPLOAD",
    resource: "Document",
    recordId: document.id,
    newValue: {
      originalName: document.originalName,
      category: document.category,
      isSensitive: document.isSensitive,
      ownerType: document.ownerType,
      ownerId: document.ownerId,
    },
  });

  return document;
}

// Sensitive documents (e.g. student identity papers) require document.manage,
// not just document.view, per PRODUCT_SPEC.md's "sensitive documents require
// explicit permission" / "teacher cannot see student identity documents by
// default" rule. Phase 0 implements only this permission-level gate — a
// finer per-record ownership check (e.g. "only this student's own Incharge")
// arrives once Phase 2+ owner entities exist.
export async function listDocuments(
  filter: { ownerType?: string; ownerId?: string },
  viewerPermissionKeys: Set<string>
) {
  const documents = await prisma.document.findMany({
    where: { ownerType: filter.ownerType, ownerId: filter.ownerId },
    orderBy: { createdAt: "desc" },
  });

  const canSeeSensitive = viewerPermissionKeys.has("document.manage");
  return documents.filter((doc) => !doc.isSensitive || canSeeSensitive);
}

export async function getDocumentForDownload(id: string, viewerPermissionKeys: Set<string>) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) throw new HttpError(404, "DOCUMENT_NOT_FOUND", "Document not found");

  if (document.isSensitive && !viewerPermissionKeys.has("document.manage")) {
    throw new HttpError(403, "FORBIDDEN", "This document requires document.manage permission");
  }

  return document;
}
