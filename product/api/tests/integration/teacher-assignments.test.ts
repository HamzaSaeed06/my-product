import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashPassword } from "../../src/lib/password.js";

const suffix = uniqueSuffix();
let teacherUserId: string;
let teacherId: string;
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let assignmentId: string | undefined;

describe("Teacher Assignments API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: "TEACHER" } });
    const passwordHash = await hashPassword("Str0ng!Passw0rd");

    const [teacherUser, campus, klass, year, subject] = await Promise.all([
      prisma.user.create({
        data: {
          email: `assign-teacher-${suffix}@example.test`,
          passwordHash,
          fullName: "Assignment Test Teacher",
          userRoles: { create: { roleId: teacherRole.id } },
        },
      }),
      prisma.campus.create({ data: { name: `Assign-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Assign-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: {
          name: `Assign-Test-Year-${suffix}`,
          startDate: new Date("2026-08-01"),
          endDate: new Date("2027-07-31"),
          instituteId: institute.id,
        },
      }),
      prisma.subject.create({ data: { name: `Assign-Test Subject ${suffix}`, instituteId: institute.id } }),
    ]);

    teacherUserId = teacherUser.id;
    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;

    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;

    const section = await prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } });
    sectionId = section.id;
  });

  afterAll(async () => {
    if (assignmentId) {
      await prisma.teacherAssignment.delete({ where: { id: assignmentId } }).catch(() => {});
    }
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
    await prisma.teacher.delete({ where: { id: teacherId } }).catch(() => {});
    await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
  });

  it("refuses a section that doesn't belong to the given class", async () => {
    const otherClass = await prisma.class.create({ data: { name: `Assign-Test Other Class ${suffix}`, instituteId: (await prisma.institute.findFirstOrThrow()).id } });
    const res = await asSuperAdmin()
      .post("/api/v1/teacher-assignments")
      .send({ teacherId, subjectId, classId: otherClass.id, sectionId, academicYearId });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("SECTION_CLASS_MISMATCH");
    await prisma.class.delete({ where: { id: otherClass.id } });
  });

  it("creates a teacher assignment", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/teacher-assignments")
      .send({ teacherId, subjectId, classId, sectionId, academicYearId });
    expect(res.status).toBe(201);
    assignmentId = res.body.id;
  });

  it("refuses a duplicate assignment (same teacher/subject/section/year)", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/teacher-assignments")
      .send({ teacherId, subjectId, classId, sectionId, academicYearId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ASSIGNMENT_EXISTS");
  });

  it("blocks archiving the teacher while this assignment is active", async () => {
    const res = await asSuperAdmin().post(`/api/v1/teachers/${teacherId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("TEACHER_HAS_ACTIVE_ASSIGNMENTS");
  });

  it("lists assignments filtered by teacher", async () => {
    const res = await asSuperAdmin().get(`/api/v1/teacher-assignments?teacherId=${teacherId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("archives the assignment, which then unblocks archiving the teacher", async () => {
    const archiveRes = await asSuperAdmin().post(`/api/v1/teacher-assignments/${assignmentId}/archive`);
    expect(archiveRes.status).toBe(200);

    const teacherArchiveRes = await asSuperAdmin().post(`/api/v1/teachers/${teacherId}/archive`);
    expect(teacherArchiveRes.status).toBe(200);
  });
});
