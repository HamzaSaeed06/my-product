import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { createApprovalRequest } from "../../src/modules/approvals/service.js";

let approvalId: string | undefined;
let requestedById: string;

describe("Approvals API (real database)", () => {
  beforeAll(async () => {
    // No public "create approval" route by design — other phases call this
    // service function directly when their own workflow needs approval.
    requestedById = asSuperAdmin().userId;
    const request = await createApprovalRequest({
      type: "TEST_ACTION",
      resource: "TestResource",
      requestedById,
      payload: { note: "integration test fixture" },
    });
    approvalId = request.id;
  });

  afterAll(async () => {
    if (approvalId) {
      await prisma.approvalRequest.delete({ where: { id: approvalId } }).catch(() => {});
    }
  });

  it("logs a REQUEST_APPROVAL audit entry on creation", async () => {
    const log = await prisma.auditLog.findFirst({
      where: { resource: "ApprovalRequest", recordId: approvalId, action: "REQUEST_APPROVAL" },
    });
    expect(log).not.toBeNull();
  });

  it("lists pending approvals including the fixture", async () => {
    const res = await asSuperAdmin().get("/api/v1/approvals?status=PENDING");
    expect(res.status).toBe(200);
    expect(res.body.some((a: { id: string }) => a.id === approvalId)).toBe(true);
  });

  it("decides the approval and rejects deciding it twice", async () => {
    const decideRes = await asSuperAdmin()
      .post(`/api/v1/approvals/${approvalId}/decide`)
      .send({ decision: "APPROVED", decisionNote: "looks fine" });

    expect(decideRes.status).toBe(200);
    expect(decideRes.body.status).toBe("APPROVED");

    const secondAttempt = await asSuperAdmin()
      .post(`/api/v1/approvals/${approvalId}/decide`)
      .send({ decision: "APPROVED" });
    expect(secondAttempt.status).toBe(409);
  });

  it("logs an APPROVE audit entry with approvedBy set", async () => {
    const log = await prisma.auditLog.findFirst({
      where: { resource: "ApprovalRequest", recordId: approvalId, action: "APPROVE" },
    });
    expect(log?.approvedBy).toBe(requestedById);
  });
});
