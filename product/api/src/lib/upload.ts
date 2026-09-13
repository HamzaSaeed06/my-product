import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { fileTypeFromFile } from "file-type";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";

// Whitelist, not blacklist, per PRODUCT_SPEC.md §8 file upload security.
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

fs.mkdirSync(env.DOCUMENT_STORAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.DOCUMENT_STORAGE_DIR),
  filename: (_req, file, cb) => {
    // Random filename, never the user-provided one — prevents path
    // traversal and filename-based attacks, per spec.
    const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const documentUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // First check: client-supplied Content-Type. Kept as-is — it's cheap
    // and rejects obviously-wrong uploads before any disk write — but it's
    // NOT trusted alone; see verifyUploadedFileType below, which is the
    // check that actually can't be spoofed by the client.
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new HttpError(400, "UNSUPPORTED_FILE_TYPE", `File type ${file.mimetype} is not allowed`));
      return;
    }
    cb(null, true);
  },
});

// Second, stricter check: file.mimetype above is entirely client-supplied
// (the browser's guess, or whatever an attacker's request sets it to) —
// trusting it alone means a whitelist that only checks a string an
// attacker controls. This runs after multer has written the file to disk
// and sniffs its actual magic bytes via `file-type`, independent of
// whatever Content-Type the request claimed. Mismatches are deleted, not
// just rejected — a wrong-type file must not linger in
// DOCUMENT_STORAGE_DIR. Apply as the middleware immediately after every
// `documentUpload.single(...)` / `.array(...)` call.
export async function verifyUploadedFileType(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const files = req.file ? [req.file] : (req.files as Express.Multer.File[] | undefined) ?? [];

  for (const file of files) {
    const claimedExt = ALLOWED_MIME_TYPES[file.mimetype];
    const detected = await fileTypeFromFile(file.path);

    // DOCX is a zip-based OOXML format; file-type (correctly) identifies
    // the container as `application/zip` on some inputs rather than the
    // more specific OOXML mime — accept either for that one extension
    // rather than false-rejecting a real Word document.
    const detectedMatches =
      detected?.mime === file.mimetype || (claimedExt === ".docx" && detected?.mime === "application/zip");

    if (!detected || !detectedMatches) {
      for (const f of files) fs.rm(f.path, { force: true }, () => {});
      next(
        new HttpError(
          400,
          "FILE_CONTENT_MISMATCH",
          `Uploaded file's content does not match its claimed type (${file.mimetype})`
        )
      );
      return;
    }
  }

  next();
}
