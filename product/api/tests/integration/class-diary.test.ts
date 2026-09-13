import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Phase 11 Phase D — a lighter running log than Homework: no
// draft/publish lifecycle, so a Teacher can post it fast.

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let teacherUserId: string;
let teacherId: string;
let entryId: string;

describe("Class Diary API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, teacherUser] = await Promise.all([
      prisma.campus.create({ data: { name: `CD-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `CD-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `CD-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `CD-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.user.create({ data: { email: `cd-teacher-${suffix}@example.test`, passwordHash: "x", fullName: "CD Test Teacher" } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;
    teacherUserId = teacherUser.id;

    const [section, teacher] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.teacher.create({ data: { userId: teacherUserId } }),
    ]);
    sectionId = section.id;
    teacherId = teacher.id;
  });

  afterAll(async () => {
    await prisma.classDiaryEntry.deleteMany({ where: { sectionId } });
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("posts a class diary entry", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/class-diary")
      .send({ sectionId, subjectId, teacherId, date: "2026-09-12", note: "Covered chapter 4: quadratic equations." });
    expect(res.status).toBe(201);
    expect(res.body.note).toBe("Covered chapter 4: quadratic equations.");
    entryId = res.body.id;
  });

  it("lists entries filtered by section", async () => {
    const res = await asSuperAdmin().get(`/api/v1/class-diary?sectionId=${sectionId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("edits a diary entry's note", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/class-diary/${entryId}`).send({ note: "Covered chapter 4 & started chapter 5." });
    expect(res.status).toBe(200);
    expect(res.body.note).toBe("Covered chapter 4 & started chapter 5.");
  });

  it("archives a diary entry", async () => {
    const res = await asSuperAdmin().post(`/api/v1/class-diary/${entryId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();

    const listRes = await asSuperAdmin().get(`/api/v1/class-diary?sectionId=${sectionId}`);
    expect(listRes.body).toHaveLength(0);
  });

  it("refuses archiving an already-archived entry", async () => {
    const res = await asSuperAdmin().post(`/api/v1/class-diary/${entryId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_ARCHIVED");
  });
});
