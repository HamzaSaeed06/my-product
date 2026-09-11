import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let instituteId: string;
let classId: string;
let categoryId: string;
let structureId: string;
let studentId: string;

describe("Fee Structures API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    instituteId = institute.id;

    const [klass, category, student] = await Promise.all([
      prisma.class.create({ data: { name: `FeeStruct-Test Class ${suffix}`, instituteId } }),
      prisma.feeCategory.create({ data: { name: `FeeStruct-Test Category ${suffix}`, instituteId } }),
      prisma.student.create({ data: { studentCode: `STU-FEESTRUCT-${suffix}`, fullName: `FeeStruct Test ${suffix}` } }),
    ]);
    classId = klass.id;
    categoryId = category.id;
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.studentFee.deleteMany({ where: { studentId } });
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    await prisma.feeStructure.deleteMany({ where: { id: structureId } });
    await prisma.feeCategory.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
  });

  it("refuses an invalid (zero) amount", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/fee-structures")
      .send({ instituteId, classId, feeCategoryId: categoryId, name: "Tuition", amount: "0.00", frequency: "MONTHLY", effectiveFrom: "2026-08-01" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_AMOUNT");
  });

  it("creates a fee structure", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/fee-structures")
      .send({ instituteId, classId, feeCategoryId: categoryId, name: "Tuition", amount: "5000.00", frequency: "MONTHLY", effectiveFrom: "2026-08-01" });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe("5000");
    structureId = res.body.id;
  });

  it("lists fee structures filtered by class", async () => {
    const res = await asSuperAdmin().get(`/api/v1/fee-structures?classId=${classId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("blocks archiving while an active student assignment exists", async () => {
    const assignRes = await asSuperAdmin().post("/api/v1/student-fees").send({ studentId, feeStructureId: structureId });
    expect(assignRes.status).toBe(201);

    const res = await asSuperAdmin().post(`/api/v1/fee-structures/${structureId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("FEE_STRUCTURE_IN_USE");
  });

  it("archives the fee structure once the assignment is archived", async () => {
    const studentFee = await prisma.studentFee.findFirstOrThrow({ where: { studentId, feeStructureId: structureId } });
    await asSuperAdmin().post(`/api/v1/student-fees/${studentFee.id}/archive`);

    const res = await asSuperAdmin().post(`/api/v1/fee-structures/${structureId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });
});
