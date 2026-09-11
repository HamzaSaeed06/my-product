import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let studentId: string;
let campusId: string;
let classId: string;
let academicYearId: string;
let closedYearId: string;
let admissionId: string | undefined;
let secondAdmissionId: string | undefined;

describe("Admissions API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [student, campus, klass, year, closedYear] = await Promise.all([
      prisma.student.create({ data: { studentCode: `STU-ADM-${suffix}`, fullName: `Admission Test ${suffix}` } }),
      prisma.campus.create({ data: { name: `Admission-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Admission-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: {
          name: `Admission-Test-Year-${suffix}`,
          startDate: new Date("2026-08-01"),
          endDate: new Date("2027-07-31"),
          instituteId: institute.id,
        },
      }),
      prisma.academicYear.create({
        data: {
          name: `Admission-Test-Closed-Year-${suffix}`,
          startDate: new Date("2025-08-01"),
          endDate: new Date("2026-07-31"),
          status: "CLOSED",
          closedAt: new Date(),
          instituteId: institute.id,
        },
      }),
    ]);
    studentId = student.id;
    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    closedYearId = closedYear.id;
  });

  afterAll(async () => {
    await prisma.admission.deleteMany({ where: { studentId } });
    await prisma.academicYear.deleteMany({ where: { id: { in: [academicYearId, closedYearId] } } });
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
    await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
  });

  it("refuses admission into a closed academic year", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/admissions")
      .send({ studentId, campusId, classId, academicYearId: closedYearId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ACADEMIC_YEAR_CLOSED");
  });

  it("creates an admission application", async () => {
    const res = await asSuperAdmin().post("/api/v1/admissions").send({ studentId, campusId, classId, academicYearId });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    admissionId = res.body.id;
  });

  it("lists admissions filtered by student", async () => {
    const res = await asSuperAdmin().get(`/api/v1/admissions?studentId=${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("approves the admission", async () => {
    const res = await asSuperAdmin().post(`/api/v1/admissions/${admissionId}/approve`).send({ decisionNote: "ok" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("refuses to decide an already-decided admission", async () => {
    const res = await asSuperAdmin().post(`/api/v1/admissions/${admissionId}/reject`);
    expect(res.status).toBe(409);
  });

  it("creates and withdraws a second, separate pending admission", async () => {
    const createRes = await asSuperAdmin()
      .post("/api/v1/admissions")
      .send({ studentId, campusId, classId, academicYearId });
    expect(createRes.status).toBe(201);
    secondAdmissionId = createRes.body.id;

    const withdrawRes = await asSuperAdmin().post(`/api/v1/admissions/${secondAdmissionId}/withdraw`);
    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.status).toBe("WITHDRAWN");
  });

  it("logs an APPROVE audit entry with approvedBy set", async () => {
    const log = await prisma.auditLog.findFirst({ where: { resource: "Admission", recordId: admissionId, action: "APPROVE" } });
    expect(log?.approvedBy).not.toBeNull();
  });
});
