import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let otherClassId: string;
let otherSectionId: string;
let subjectId: string;
let curriculumId: string;

describe("Curriculum API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, otherClass, year, subject] = await Promise.all([
      prisma.campus.create({ data: { name: `Curr-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Curr-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Curr-Test Other Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Curr-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `Curr-Test Subject ${suffix}`, instituteId: institute.id } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    otherClassId = otherClass.id;
    academicYearId = year.id;
    subjectId = subject.id;

    const [section, otherSection] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.section.create({ data: { classId: otherClassId, campusId, academicYearId, name: "A" } }),
    ]);
    sectionId = section.id;
    otherSectionId = otherSection.id;
  });

  afterAll(async () => {
    await prisma.curriculumProgress.deleteMany({ where: { curriculumId } });
    await prisma.curriculum.deleteMany({ where: { id: curriculumId } });
    await prisma.section.deleteMany({ where: { id: { in: [sectionId, otherSectionId] } } });
    await prisma.class.deleteMany({ where: { id: { in: [classId, otherClassId] } } });
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates a curriculum topic", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/curriculum")
      .send({ subjectId, classId, academicYearId, topic: "Chapter 1: Introduction", sortOrder: 1 });
    expect(res.status).toBe(201);
    curriculumId = res.body.id;
  });

  it("lists curriculum topics for a class", async () => {
    const res = await asSuperAdmin().get(`/api/v1/curriculum?classId=${classId}&academicYearId=${academicYearId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("refuses marking progress for a section that doesn't belong to the topic's class", async () => {
    const res = await asSuperAdmin().post(`/api/v1/curriculum/${curriculumId}/progress/${otherSectionId}`).send({ completed: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("SECTION_CLASS_MISMATCH");
  });

  it("marks progress complete for a section", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/curriculum/${curriculumId}/progress/${sectionId}`)
      .send({ completed: true, notes: "Covered in class" });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).not.toBeNull();
  });

  it("un-marks progress (toggle back to incomplete)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/curriculum/${curriculumId}/progress/${sectionId}`).send({ completed: false });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
  });

  it("updates the topic", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/curriculum/${curriculumId}`).send({ topic: "Chapter 1: Revised Introduction" });
    expect(res.status).toBe(200);
    expect(res.body.topic).toBe("Chapter 1: Revised Introduction");
  });

  it("archives the topic", async () => {
    const res = await asSuperAdmin().post(`/api/v1/curriculum/${curriculumId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();

    const listRes = await asSuperAdmin().get(`/api/v1/curriculum?classId=${classId}&academicYearId=${academicYearId}`);
    expect(listRes.body).toHaveLength(0);
  });
});
