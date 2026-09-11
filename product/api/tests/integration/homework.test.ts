import fs from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let teacherUserId: string;
let teacherId: string;
let homeworkId: string;
let documentStoragePath: string | undefined;

describe("Homework API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, teacherUser] = await Promise.all([
      prisma.campus.create({ data: { name: `HW-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `HW-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `HW-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `HW-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.user.create({ data: { email: `hw-teacher-${suffix}@example.test`, passwordHash: "x", fullName: "HW Test Teacher" } }),
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
    const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
    await prisma.homework.deleteMany({ where: { id: homeworkId } });
    if (homework?.documentId) {
      await prisma.document.delete({ where: { id: homework.documentId } }).catch(() => {});
    }
    if (documentStoragePath) fs.rmSync(documentStoragePath, { force: true });
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates homework with an attached file", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/homework")
      .field("subjectId", subjectId)
      .field("sectionId", sectionId)
      .field("classId", classId)
      .field("teacherId", teacherId)
      .field("title", "Algebra worksheet")
      .field("dueDate", "2026-09-20")
      .attach("file", Buffer.from("worksheet contents"), { filename: "worksheet.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.document).not.toBeNull();
    homeworkId = res.body.id;
    documentStoragePath = res.body.document.storagePath;
  });

  it("lists homework filtered by section", async () => {
    const res = await asSuperAdmin().get(`/api/v1/homework?sectionId=${sectionId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("updates homework", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/homework/${homeworkId}`).send({ title: "Algebra worksheet (updated)" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Algebra worksheet (updated)");
  });

  it("publishes homework", async () => {
    const res = await asSuperAdmin().post(`/api/v1/homework/${homeworkId}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PUBLISHED");
  });

  it("refuses publishing already-published homework", async () => {
    const res = await asSuperAdmin().post(`/api/v1/homework/${homeworkId}/publish`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_PUBLISHED");
  });

  it("archives homework", async () => {
    const res = await asSuperAdmin().post(`/api/v1/homework/${homeworkId}/archive`);
    expect(res.status).toBe(200);
    expect(res.body.archivedAt).not.toBeNull();

    const listRes = await asSuperAdmin().get(`/api/v1/homework?sectionId=${sectionId}`);
    expect(listRes.body).toHaveLength(0);
  });
});
