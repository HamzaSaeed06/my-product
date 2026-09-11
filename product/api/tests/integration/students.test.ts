import fs from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const fullName = `Test Student ${suffix}`;
let studentId: string | undefined;
let documentId: string | undefined;
let documentStoragePath: string | undefined;

describe("Students API (real database)", () => {
  afterAll(async () => {
    if (documentId) {
      await prisma.studentDocument.deleteMany({ where: { documentId } });
      await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
    }
    if (documentStoragePath) fs.rmSync(documentStoragePath, { force: true });
    if (studentId) {
      await prisma.enrollment.deleteMany({ where: { studentId } });
      await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    }
  });

  it("creates a student with a generated permanent studentCode", async () => {
    const res = await asSuperAdmin().post("/api/v1/students").send({ fullName, phone: `555-${suffix}` });
    expect(res.status).toBe(201);
    expect(res.body.studentCode).toMatch(/^STU-\d{8}$/);
    expect(res.body.status).toBe("ACTIVE");
    studentId = res.body.id;
  });

  it("finds the student via duplicate-check search", async () => {
    const res = await asSuperAdmin().get(`/api/v1/students/search?q=${encodeURIComponent(fullName)}`);
    expect(res.status).toBe(200);
    expect(res.body.some((s: { id: string }) => s.id === studentId)).toBe(true);
  });

  it("gets the student detail with empty parents/enrollments", async () => {
    const res = await asSuperAdmin().get(`/api/v1/students/${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body.parents).toEqual([]);
    expect(res.body.enrollments).toEqual([]);
  });

  it("updates the student and audits it as an identity correction", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/students/${studentId}`).send({ phone: "555-0000" });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe("555-0000");

    const log = await prisma.auditLog.findFirst({ where: { resource: "Student", recordId: studentId, action: "UPDATE" } });
    expect(log).not.toBeNull();
  });

  it("uploads a document for the student and links it via StudentDocument", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/students/${studentId}/documents`)
      .field("category", "birth_certificate")
      .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "birth-cert.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(201);
    documentId = res.body.id;
    documentStoragePath = res.body.storagePath;

    const link = await prisma.studentDocument.findUnique({ where: { documentId } });
    expect(link?.studentId).toBe(studentId);
  });

  it("lists the student's documents", async () => {
    const res = await asSuperAdmin().get(`/api/v1/students/${studentId}/documents`);
    expect(res.status).toBe(200);
    expect(res.body.some((d: { id: string }) => d.id === documentId)).toBe(true);
  });

  it("withdraws the student", async () => {
    const res = await asSuperAdmin().post(`/api/v1/students/${studentId}/withdraw`).send({ reason: "Relocated" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("WITHDRAWN");
  });

  it("refuses to withdraw an already-withdrawn student", async () => {
    const res = await asSuperAdmin().post(`/api/v1/students/${studentId}/withdraw`).send({});
    expect(res.status).toBe(409);
  });

  it("archives the student", async () => {
    const res = await asSuperAdmin().post(`/api/v1/students/${studentId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ARCHIVED");
  });
});
