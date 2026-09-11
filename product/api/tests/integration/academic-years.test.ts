import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const yearName = `Test-Year-${suffix}`;
let academicYearId: string | undefined;

describe("Academic Years API (real database)", () => {
  afterAll(async () => {
    if (academicYearId) {
      await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    }
  });

  it("rejects endDate before startDate", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/academic-years")
      .send({ name: `${yearName}-bad`, startDate: "2027-08-01", endDate: "2026-08-01" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_DATE_RANGE");
  });

  it("creates an academic year", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/academic-years")
      .send({ name: yearName, startDate: "2026-08-01", endDate: "2027-07-31" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ACTIVE");
    academicYearId = res.body.id;
  });

  it("rejects a duplicate name", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/academic-years")
      .send({ name: yearName, startDate: "2026-08-01", endDate: "2027-07-31" });
    expect(res.status).toBe(409);
  });

  it("updates the academic year while active", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/academic-years/${academicYearId}`)
      .send({ endDate: "2027-08-15" });
    expect(res.status).toBe(200);
  });

  it("closes the academic year", async () => {
    const res = await asSuperAdmin().post(`/api/v1/academic-years/${academicYearId}/close`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CLOSED");
    expect(res.body.closedAt).not.toBeNull();
  });

  it("refuses to edit a closed academic year (read-only)", async () => {
    const res = await asSuperAdmin()
      .patch(`/api/v1/academic-years/${academicYearId}`)
      .send({ endDate: "2028-01-01" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ACADEMIC_YEAR_CLOSED");
  });

  it("refuses to close an already-closed year", async () => {
    const res = await asSuperAdmin().post(`/api/v1/academic-years/${academicYearId}/close`);
    expect(res.status).toBe(409);
  });
});
