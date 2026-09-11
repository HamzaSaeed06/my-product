import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionAId: string;
let sectionBId: string;
let subjectAId: string;
let subjectBId: string;
let teacherAUserId: string;
let teacherAId: string;
let teacherBUserId: string;
let teacherBId: string;
let timetableAId: string;
let timetableBId: string;
let entryId: string;

describe("Timetable API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subjectA, subjectB, teacherAUser, teacherBUser] = await Promise.all([
      prisma.campus.create({ data: { name: `TT-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `TT-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `TT-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `TT-Test Subject A ${suffix}`, instituteId: institute.id } }),
      prisma.subject.create({ data: { name: `TT-Test Subject B ${suffix}`, instituteId: institute.id } }),
      prisma.user.create({ data: { email: `tt-teacher-a-${suffix}@example.test`, passwordHash: "x", fullName: "TT Teacher A" } }),
      prisma.user.create({ data: { email: `tt-teacher-b-${suffix}@example.test`, passwordHash: "x", fullName: "TT Teacher B" } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectAId = subjectA.id;
    subjectBId = subjectB.id;
    teacherAUserId = teacherAUser.id;
    teacherBUserId = teacherBUser.id;

    const [sectionA, sectionB, teacherA, teacherB] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "B" } }),
      prisma.teacher.create({ data: { userId: teacherAUserId } }),
      prisma.teacher.create({ data: { userId: teacherBUserId } }),
    ]);
    sectionAId = sectionA.id;
    sectionBId = sectionB.id;
    teacherAId = teacherA.id;
    teacherBId = teacherB.id;
  });

  afterAll(async () => {
    await prisma.timetableEntry.deleteMany({ where: { timetableId: { in: [timetableAId, timetableBId].filter(Boolean) } } });
    await prisma.timetable.deleteMany({ where: { sectionId: { in: [sectionAId, sectionBId] } } });
    await prisma.section.deleteMany({ where: { id: { in: [sectionAId, sectionBId] } } });
    await prisma.teacher.deleteMany({ where: { id: { in: [teacherAId, teacherBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherAUserId, teacherBUserId] } } });
    await prisma.subject.deleteMany({ where: { id: { in: [subjectAId, subjectBId] } } });
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("gets-or-creates a timetable for a section (idempotent)", async () => {
    const res1 = await asSuperAdmin().get(`/api/v1/timetables?sectionId=${sectionAId}&academicYearId=${academicYearId}`);
    expect(res1.status).toBe(200);
    timetableAId = res1.body.id;
    expect(res1.body.status).toBe("DRAFT");

    const res2 = await asSuperAdmin().get(`/api/v1/timetables?sectionId=${sectionAId}&academicYearId=${academicYearId}`);
    expect(res2.body.id).toBe(timetableAId);
  });

  it("adds a timetable entry", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/timetables/${timetableAId}/entries`)
      .send({ dayOfWeek: "MONDAY", periodNumber: 1, subjectId: subjectAId, teacherId: teacherAId });
    expect(res.status).toBe(201);
    entryId = res.body.id;
  });

  it("refuses a second subject in the same section/day/period slot", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/timetables/${timetableAId}/entries`)
      .send({ dayOfWeek: "MONDAY", periodNumber: 1, subjectId: subjectBId, teacherId: teacherBId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("SECTION_SLOT_CONFLICT");
  });

  it("refuses scheduling the same teacher in two places at the same day/period", async () => {
    const ttRes = await asSuperAdmin().get(`/api/v1/timetables?sectionId=${sectionBId}&academicYearId=${academicYearId}`);
    timetableBId = ttRes.body.id;

    const res = await asSuperAdmin()
      .post(`/api/v1/timetables/${timetableBId}/entries`)
      .send({ dayOfWeek: "MONDAY", periodNumber: 1, subjectId: subjectBId, teacherId: teacherAId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("TEACHER_CONFLICT");
  });

  it("updates an entry to a free slot", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/timetables/entries/${entryId}`).send({ periodNumber: 2 });
    expect(res.status).toBe(200);
    expect(res.body.periodNumber).toBe(2);
  });

  it("publishes the timetable", async () => {
    const res = await asSuperAdmin().post(`/api/v1/timetables/${timetableAId}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PUBLISHED");
  });

  it("refuses publishing an already-published timetable", async () => {
    const res = await asSuperAdmin().post(`/api/v1/timetables/${timetableAId}/publish`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_PUBLISHED");
  });

  it("removes an entry", async () => {
    const res = await asSuperAdmin().delete(`/api/v1/timetables/entries/${entryId}`);
    expect(res.status).toBe(204);

    const timetable = await asSuperAdmin().get(`/api/v1/timetables/${timetableAId}`);
    expect(timetable.body.entries).toHaveLength(0);
  });
});
