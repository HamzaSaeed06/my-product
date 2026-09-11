import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let studentId: string;
let campusId: string;
let classAId: string;
let classBId: string;
let academicYearId: string;
let sectionAId: string;
let sectionBId: string;
let enrollmentId: string | undefined;
let transferredEnrollmentId: string | undefined;

describe("Enrollments API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [student, campus, classA, classB, year] = await Promise.all([
      prisma.student.create({ data: { studentCode: `STU-ENR-${suffix}`, fullName: `Enrollment Test ${suffix}` } }),
      prisma.campus.create({ data: { name: `Enrollment-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Enrollment-Test Class A ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Enrollment-Test Class B ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: {
          name: `Enrollment-Test-Year-${suffix}`,
          startDate: new Date("2026-08-01"),
          endDate: new Date("2027-07-31"),
          instituteId: institute.id,
        },
      }),
    ]);
    studentId = student.id;
    campusId = campus.id;
    classAId = classA.id;
    classBId = classB.id;
    academicYearId = year.id;

    const [sectionA, sectionB] = await Promise.all([
      prisma.section.create({ data: { classId: classAId, campusId, academicYearId, name: "A" } }),
      prisma.section.create({ data: { classId: classBId, campusId, academicYearId, name: "A" } }),
    ]);
    sectionAId = sectionA.id;
    sectionBId = sectionB.id;
  });

  afterAll(async () => {
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.section.deleteMany({ where: { id: { in: [sectionAId, sectionBId] } } });
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.deleteMany({ where: { id: { in: [classAId, classBId] } } });
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
  });

  it("refuses a section that doesn't belong to the given class", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/enrollments")
      .send({ studentId, academicYearId, classId: classAId, sectionId: sectionBId });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("SECTION_CLASS_MISMATCH");
  });

  it("creates an enrollment", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/enrollments")
      .send({ studentId, academicYearId, classId: classAId, sectionId: sectionAId, rollNumber: "14" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ACTIVE");
    enrollmentId = res.body.id;
  });

  it("refuses a second active enrollment in the same academic year", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/enrollments")
      .send({ studentId, academicYearId, classId: classBId, sectionId: sectionBId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ENROLLMENT_ALREADY_ACTIVE");
  });

  it("transfers the student to Class B, creating a new enrollment and marking the old one TRANSFERRED", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/enrollments/${enrollmentId}/transfer`)
      .send({ classId: classBId, sectionId: sectionBId, rollNumber: "3" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ACTIVE");
    expect(res.body.classId).toBe(classBId);
    transferredEnrollmentId = res.body.id;

    const old = await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollmentId } });
    expect(old.status).toBe("TRANSFERRED");
  });

  it("still only allows one active enrollment after a transfer", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/enrollments")
      .send({ studentId, academicYearId, classId: classAId, sectionId: sectionAId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ENROLLMENT_ALREADY_ACTIVE");
  });

  it("student now has 2 enrollment rows in history (old TRANSFERRED, new ACTIVE)", async () => {
    const res = await asSuperAdmin().get(`/api/v1/enrollments?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("withdraws the active (post-transfer) enrollment", async () => {
    const res = await asSuperAdmin().post(`/api/v1/enrollments/${transferredEnrollmentId}/withdraw`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("WITHDRAWN");
  });

  it("re-enrolling a withdrawn student reactivates them", async () => {
    await prisma.student.update({ where: { id: studentId }, data: { status: "WITHDRAWN", withdrawnAt: new Date() } });

    const res = await asSuperAdmin()
      .post("/api/v1/enrollments")
      .send({ studentId, academicYearId, classId: classAId, sectionId: sectionAId, rollNumber: "9" });
    expect(res.status).toBe(201);

    const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    expect(student.status).toBe("ACTIVE");
  });
});
