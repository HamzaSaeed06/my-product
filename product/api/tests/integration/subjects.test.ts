import { afterAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const name = `Test Subject ${suffix}`;
let subjectId: string | undefined;

describe("Subjects API (real database)", () => {
  afterAll(async () => {
    if (subjectId) {
      await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    }
  });

  it("creates a subject", async () => {
    const res = await asSuperAdmin().post("/api/v1/subjects").send({ name, code: `SUBJ-${suffix}` });
    expect(res.status).toBe(201);
    subjectId = res.body.id;
  });

  it("rejects a duplicate subject name", async () => {
    const res = await asSuperAdmin().post("/api/v1/subjects").send({ name });
    expect(res.status).toBe(409);
  });

  it("updates the subject", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/subjects/${subjectId}`).send({ code: "NEWCODE" });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe("NEWCODE");
  });

  it("archives the subject (no active assignments)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/subjects/${subjectId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });
});
