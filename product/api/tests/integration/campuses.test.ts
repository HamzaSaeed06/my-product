import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const campusName = `Test Campus ${suffix}`;
let campusId: string | undefined;

describe("Campuses API (real database)", () => {
  afterAll(async () => {
    if (campusId) {
      await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
    }
  });

  it("creates a campus", async () => {
    const res = await asSuperAdmin().post("/api/v1/campuses").send({ name: campusName, address: "123 Main St" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(campusName);
    campusId = res.body.id;
  });

  it("lists campuses including the new one", async () => {
    const res = await asSuperAdmin().get("/api/v1/campuses");
    expect(res.status).toBe(200);
    expect(res.body.some((c: { id: string }) => c.id === campusId)).toBe(true);
  });

  it("updates the campus", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/campuses/${campusId}`).send({ phone: "555-1234" });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe("555-1234");
  });

  it("archives the campus (no active sections)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/campuses/${campusId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });

  it("refuses to edit an archived campus", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/campuses/${campusId}`).send({ phone: "555-9999" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CAMPUS_ARCHIVED");
  });

  it("refuses to archive an already-archived campus", async () => {
    const res = await asSuperAdmin().post(`/api/v1/campuses/${campusId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CAMPUS_ALREADY_ARCHIVED");
  });
});
