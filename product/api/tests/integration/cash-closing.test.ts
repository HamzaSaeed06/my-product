import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let closingId: string;

describe("Cash Closing API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const campus = await prisma.campus.create({ data: { name: `CashClosing-Test Campus ${suffix}`, instituteId: institute.id } });
    campusId = campus.id;
  });

  afterAll(async () => {
    await prisma.cashClosing.deleteMany({ where: { campusId } });
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates a cash closing with a computed variance", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/cash-closing")
      .send({ campusId, date: "2026-09-10", openingBalance: "1000.00", collections: "5000.00", refundsPaidOut: "200.00", actualBalance: "5750.00" });
    expect(res.status).toBe(201);
    expect(res.body.expectedBalance).toBe("5800");
    expect(res.body.variance).toBe("-50");
    expect(res.body.status).toBe("PENDING");
    closingId = res.body.id;
  });

  it("refuses a duplicate closing for the same campus/date", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/cash-closing")
      .send({ campusId, date: "2026-09-10", openingBalance: "0", collections: "0", refundsPaidOut: "0", actualBalance: "0" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CASH_CLOSING_EXISTS");
  });

  it("lists cash closings for the campus", async () => {
    const res = await asSuperAdmin().get(`/api/v1/cash-closing?campusId=${campusId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("approves the cash closing (variance requires approval)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/cash-closing/${closingId}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("refuses approving an already-approved closing", async () => {
    const res = await asSuperAdmin().post(`/api/v1/cash-closing/${closingId}/approve`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_APPROVED");
  });
});
