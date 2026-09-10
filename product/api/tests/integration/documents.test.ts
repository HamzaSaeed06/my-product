import fs from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { listDocuments, getDocumentForDownload } from "../../src/modules/documents/service.js";

const fakePdfBytes = Buffer.from("%PDF-1.4 fake content for integration test");
let documentId: string | undefined;
let storagePath: string | undefined;

describe("Documents API (real database)", () => {
  afterAll(async () => {
    if (documentId) {
      await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
    }
    if (storagePath) {
      fs.rmSync(storagePath, { force: true });
    }
  });

  it("rejects an unsupported file type", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/documents")
      .attach("file", Buffer.from("just text"), { filename: "note.txt", contentType: "text/plain" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("uploads a sensitive PDF document", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/documents")
      .field("category", "test")
      .field("isSensitive", "true")
      .attach("file", fakePdfBytes, { filename: "identity.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(201);
    expect(res.body.isSensitive).toBe(true);
    expect(res.body.originalName).toBe("identity.pdf");
    // Random stored filename, never the user-provided one.
    expect(res.body.fileName).not.toBe("identity.pdf");

    documentId = res.body.id;
    storagePath = res.body.storagePath;
    expect(fs.existsSync(storagePath!)).toBe(true);
  });

  it("downloads the exact bytes that were uploaded", async () => {
    const res = await asSuperAdmin().get(`/api/v1/documents/${documentId}/download`);
    expect(res.status).toBe(200);
    expect(Buffer.compare(res.body, fakePdfBytes)).toBe(0);
  });

  it("hides sensitive documents from a viewer without document.manage", async () => {
    const withoutManage = await listDocuments({}, new Set(["document.view"]));
    expect(withoutManage.some((d) => d.id === documentId)).toBe(false);

    const withManage = await listDocuments({}, new Set(["document.view", "document.manage"]));
    expect(withManage.some((d) => d.id === documentId)).toBe(true);
  });

  it("denies download of a sensitive document without document.manage", async () => {
    await expect(getDocumentForDownload(documentId!, new Set(["document.view"]))).rejects.toMatchObject({
      status: 403,
    });
  });

  it("logs an UPLOAD audit entry", async () => {
    const log = await prisma.auditLog.findFirst({
      where: { resource: "Document", recordId: documentId, action: "UPLOAD" },
    });
    expect(log).not.toBeNull();
  });
});
