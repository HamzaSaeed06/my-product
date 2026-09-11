import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let instituteId: string;
let classId: string;
let categoryId: string;
let structureId: string;
let studentId: string;
let studentFeeId: string;

describe("Student Fees API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    instituteId = institute.id;

    const [klass, category, student] = await Promise.all([
      prisma.class.create({ data: { name: `StudentFee-Test Class ${suffix}`, instituteId } }),
      prisma.feeCategory.create({ data: { name: `StudentFee-Test Category ${suffix}`, instituteId } }),
      prisma.student.create({ data: { studentCode: `STU-SFEE-${suffix}`, fullName: `StudentFee Test ${suffix}` } }),
    ]);
    classId = klass.id;
    categoryId = category.id;
    studentId = student.id;

    const structure = await prisma.feeStructure.create({
      data: { instituteId, classId, feeCategoryId: categoryId, name: "Tuition", amount: "3000.00", frequency: "MONTHLY", effectiveFrom: new Date("2026-08-01") },
    });
    structureId = structure.id;
  });

  afterAll(async () => {
    await prisma.studentFee.deleteMany({ where: { studentId } });
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    await prisma.feeStructure.delete({ where: { id: structureId } }).catch(() => {});
    await prisma.feeCategory.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
  });

  it("assigns a fee structure to a student", async () => {
    const res = await asSuperAdmin().post("/api/v1/student-fees").send({ studentId, feeStructureId: structureId, overrideAmount: "2500.00" });
    expect(res.status).toBe(201);
    expect(res.body.overrideAmount).toBe("2500");
    studentFeeId = res.body.id;
  });

  it("refuses assigning the same fee structure twice", async () => {
    const res = await asSuperAdmin().post("/api/v1/student-fees").send({ studentId, feeStructureId: structureId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_ASSIGNED");
  });

  it("lists a student's fee assignments", async () => {
    const res = await asSuperAdmin().get(`/api/v1/student-fees?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("archives the assignment", async () => {
    const res = await asSuperAdmin().post(`/api/v1/student-fees/${studentFeeId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();
  });
});
