import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let closedAcademicYearId: string;
let sectionId: string | undefined;

describe("Sections API (real database)", () => {
  beforeAll(async () => {
    const [campus, klass, year, closedYear] = await Promise.all([
      prisma.campus.create({
        data: { name: `Section-Test Campus ${suffix}`, instituteId: (await prisma.institute.findFirstOrThrow()).id },
      }),
      prisma.class.create({
        data: { name: `Section-Test Class ${suffix}`, instituteId: (await prisma.institute.findFirstOrThrow()).id },
      }),
      prisma.academicYear.create({
        data: {
          name: `Section-Test-Year-${suffix}`,
          startDate: new Date("2026-08-01"),
          endDate: new Date("2027-07-31"),
          instituteId: (await prisma.institute.findFirstOrThrow()).id,
        },
      }),
      prisma.academicYear.create({
        data: {
          name: `Section-Test-Closed-Year-${suffix}`,
          startDate: new Date("2025-08-01"),
          endDate: new Date("2026-07-31"),
          status: "CLOSED",
          closedAt: new Date(),
          instituteId: (await prisma.institute.findFirstOrThrow()).id,
        },
      }),
    ]);
    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    closedAcademicYearId = closedYear.id;
  });

  afterAll(async () => {
    await prisma.section.deleteMany({ where: { OR: [{ campusId }, { classId }] } });
    await prisma.academicYear.deleteMany({ where: { id: { in: [academicYearId, closedAcademicYearId] } } });
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates a section", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/sections")
      .send({ classId, campusId, academicYearId, name: "A", capacity: 30 });
    expect(res.status).toBe(201);
    sectionId = res.body.id;
  });

  it("rejects a duplicate section (same class/campus/year/name)", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/sections")
      .send({ classId, campusId, academicYearId, name: "A" });
    expect(res.status).toBe(409);
  });

  it("refuses to create a section in a closed academic year", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/sections")
      .send({ classId, campusId, academicYearId: closedAcademicYearId, name: "B" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ACADEMIC_YEAR_CLOSED");
  });

  it("updates the section", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/sections/${sectionId}`).send({ capacity: 35 });
    expect(res.status).toBe(200);
    expect(res.body.capacity).toBe(35);
  });

  it("blocks archiving the parent campus while this active section exists", async () => {
    const res = await asSuperAdmin().post(`/api/v1/campuses/${campusId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CAMPUS_HAS_ACTIVE_SECTIONS");
  });

  it("blocks archiving the parent class while this active section exists", async () => {
    const res = await asSuperAdmin().post(`/api/v1/classes/${classId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("CLASS_HAS_ACTIVE_SECTIONS");
  });

  it("archives the section, which then unblocks archiving campus/class", async () => {
    const archiveRes = await asSuperAdmin().post(`/api/v1/sections/${sectionId}/archive`);
    expect(archiveRes.status).toBe(200);

    const campusArchiveRes = await asSuperAdmin().post(`/api/v1/campuses/${campusId}/archive`);
    expect(campusArchiveRes.status).toBe(200);

    const classArchiveRes = await asSuperAdmin().post(`/api/v1/classes/${classId}/archive`);
    expect(classArchiveRes.status).toBe(200);
  });
});
