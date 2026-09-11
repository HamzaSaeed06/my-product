import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
const DATE = "2026-09-14"; // a Monday, matching entry.dayOfWeek below

let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let originalTeacherUserId: string;
let originalTeacherId: string;
let substituteTeacherUserId: string;
let substituteTeacherId: string;
let busyTeacherUserId: string;
let busyTeacherId: string;
let freeTeacherUserId: string;
let freeTeacherId: string;
let timetableId: string;
let entryId: string;
let busyEntryTimetableId: string;
let substitutionId: string;

describe("Substitutions API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, originalUser, substituteUser, busyUser, freeUser] = await Promise.all([
      prisma.campus.create({ data: { name: `Sub-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Sub-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Sub-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `Sub-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.user.create({ data: { email: `sub-orig-${suffix}@example.test`, passwordHash: "x", fullName: "Sub Original Teacher" } }),
      prisma.user.create({ data: { email: `sub-sub-${suffix}@example.test`, passwordHash: "x", fullName: "Sub Substitute Teacher" } }),
      prisma.user.create({ data: { email: `sub-busy-${suffix}@example.test`, passwordHash: "x", fullName: "Sub Busy Teacher" } }),
      prisma.user.create({ data: { email: `sub-free-${suffix}@example.test`, passwordHash: "x", fullName: "Sub Free Teacher" } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;
    originalTeacherUserId = originalUser.id;
    substituteTeacherUserId = substituteUser.id;
    busyTeacherUserId = busyUser.id;
    freeTeacherUserId = freeUser.id;

    const [sectionA, sectionB, originalTeacher, substituteTeacher, busyTeacher, freeTeacher] = await Promise.all([
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } }),
      prisma.section.create({ data: { classId, campusId, academicYearId, name: "B" } }),
      prisma.teacher.create({ data: { userId: originalTeacherUserId } }),
      prisma.teacher.create({ data: { userId: substituteTeacherUserId } }),
      prisma.teacher.create({ data: { userId: busyTeacherUserId } }),
      prisma.teacher.create({ data: { userId: freeTeacherUserId } }),
    ]);
    sectionId = sectionA.id;
    originalTeacherId = originalTeacher.id;
    substituteTeacherId = substituteTeacher.id;
    busyTeacherId = busyTeacher.id;
    freeTeacherId = freeTeacher.id;

    const [timetable, busyTimetable] = await Promise.all([
      prisma.timetable.create({ data: { sectionId: sectionA.id, academicYearId } }),
      prisma.timetable.create({ data: { sectionId: sectionB.id, academicYearId } }),
    ]);
    timetableId = timetable.id;
    busyEntryTimetableId = busyTimetable.id;

    const entry = await prisma.timetableEntry.create({
      data: { timetableId, dayOfWeek: "MONDAY", periodNumber: 1, subjectId, teacherId: originalTeacherId },
    });
    entryId = entry.id;

    // Makes the "substitute" teacher busy in a different section at the exact
    // same day/period, so the free-teacher conflict check has something real
    // to reject.
    await prisma.timetableEntry.create({
      data: { timetableId: busyEntryTimetableId, dayOfWeek: "MONDAY", periodNumber: 1, subjectId, teacherId: busyTeacherId },
    });
  });

  afterAll(async () => {
    await prisma.substitution.deleteMany({ where: { timetableEntryId: entryId } });
    await prisma.timetableEntry.deleteMany({ where: { timetableId: { in: [timetableId, busyEntryTimetableId] } } });
    await prisma.timetable.deleteMany({ where: { id: { in: [timetableId, busyEntryTimetableId] } } });
    await prisma.teacherAttendance.deleteMany({ where: { teacherId: originalTeacherId } });
    await prisma.section.deleteMany({ where: { classId } });
    await prisma.teacher.deleteMany({ where: { id: { in: [originalTeacherId, substituteTeacherId, busyTeacherId, freeTeacherId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [originalTeacherUserId, substituteTeacherUserId, busyTeacherUserId, freeTeacherUserId] } } });
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("refuses a substitution when the original teacher isn't marked absent", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/substitutions")
      .send({ timetableEntryId: entryId, date: DATE, substituteTeacherId });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TEACHER_NOT_MARKED_ABSENT");
  });

  it("refuses a substitute who already has a class at that day/period", async () => {
    await prisma.teacherAttendance.create({ data: { teacherId: originalTeacherId, date: new Date(DATE), status: "ABSENT", markedById: substituteTeacherUserId } });

    const res = await asSuperAdmin()
      .post("/api/v1/substitutions")
      .send({ timetableEntryId: entryId, date: DATE, substituteTeacherId: busyTeacherId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("SUBSTITUTE_NOT_FREE");
  });

  it("assigns a free substitute teacher", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/substitutions")
      .send({ timetableEntryId: entryId, date: DATE, substituteTeacherId, reason: "Sick leave" });
    expect(res.status).toBe(201);
    substitutionId = res.body.id;
  });

  it("refuses a second active substitution for the same entry/date, even with a free teacher", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/substitutions")
      .send({ timetableEntryId: entryId, date: DATE, substituteTeacherId: freeTeacherId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("SUBSTITUTION_EXISTS");
  });

  it("lists substitutions filtered by date", async () => {
    const res = await asSuperAdmin().get(`/api/v1/substitutions?date=${DATE}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("cancels the substitution", async () => {
    const res = await asSuperAdmin().post(`/api/v1/substitutions/${substitutionId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.cancelledAt).not.toBeNull();
  });

  it("refuses cancelling an already-cancelled substitution", async () => {
    const res = await asSuperAdmin().post(`/api/v1/substitutions/${substitutionId}/cancel`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_CANCELLED");
  });
});
