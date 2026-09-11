import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let academicYearId: string;
let closedYearId: string;
let examId: string;

describe("Exams API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [year, closedYear] = await Promise.all([
      prisma.academicYear.create({
        data: { name: `Exam-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.academicYear.create({
        data: {
          name: `Exam-Test-Closed-Year-${suffix}`,
          startDate: new Date("2025-08-01"),
          endDate: new Date("2026-07-31"),
          instituteId: institute.id,
          status: "CLOSED",
          closedAt: new Date(),
        },
      }),
    ]);
    academicYearId = year.id;
    closedYearId = closedYear.id;
  });

  afterAll(async () => {
    await prisma.exam.deleteMany({ where: { academicYearId: { in: [academicYearId, closedYearId] } } });
    await prisma.academicYear.deleteMany({ where: { id: { in: [academicYearId, closedYearId] } } });
  });

  it("refuses creating an exam in a closed academic year", async () => {
    const res = await asSuperAdmin().post("/api/v1/exams").send({ academicYearId: closedYearId, name: "Midterm" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ACADEMIC_YEAR_CLOSED");
  });

  it("creates an exam", async () => {
    const res = await asSuperAdmin().post("/api/v1/exams").send({ academicYearId, name: "Midterm" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("DRAFT");
    examId = res.body.id;
  });

  it("refuses a duplicate exam name in the same academic year", async () => {
    const res = await asSuperAdmin().post("/api/v1/exams").send({ academicYearId, name: "Midterm" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("EXAM_EXISTS");
  });

  it("lists exams filtered by academic year", async () => {
    const res = await asSuperAdmin().get(`/api/v1/exams?academicYearId=${academicYearId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("publishes the exam", async () => {
    const res = await asSuperAdmin().post(`/api/v1/exams/${examId}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PUBLISHED");
  });

  it("refuses publishing an already-published exam", async () => {
    const res = await asSuperAdmin().post(`/api/v1/exams/${examId}/publish`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_PUBLISHED");
  });
});
