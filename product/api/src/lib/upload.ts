import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
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
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new HttpError(400, "UNSUPPORTED_FILE_TYPE", `File type ${file.mimetype} is not allowed`));
      return;
    }
    cb(null, true);
  },
});
