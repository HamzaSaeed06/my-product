import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Phase 11 Phase C — pre-enrollment stage. An inquiry is lighter than a
// real Admission (no Student row) until deliberately converted.

const suffix = uniqueSuffix();
let campusId: string;
let academicYearId: string;
let classId: string;
let inquiryId: string;
let convertedStudentId: string;
let convertedParentId: string;
let convertedAdmissionId: string;

describe("Admission Inquiries API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();
    const [campus, year, klass] = await Promise.all([
      prisma.campus.create({ data: { name: `Inquiry-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Inquiry-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.class.create({ data: { name: `Inquiry-Test Class ${suffix}`, instituteId: institute.id } }),
    ]);
    campusId = campus.id;
    academicYearId = year.id;
    classId = klass.id;
  });

  afterAll(async () => {
    if (convertedAdmissionId) await prisma.admission.deleteMany({ where: { id: convertedAdmissionId } }).catch(() => {});
    if (inquiryId) await prisma.admissionInquiry.deleteMany({ where: { id: inquiryId } }).catch(() => {});
    if (convertedStudentId) {
      await prisma.studentParent.deleteMany({ where: { studentId: convertedStudentId } }).catch(() => {});
      await prisma.student.delete({ where: { id: convertedStudentId } }).catch(() => {});
    }
    if (convertedParentId) await prisma.parent.delete({ where: { id: convertedParentId } }).catch(() => {});
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    if (academicYearId) await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    if (campusId) await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("creates an admission inquiry — no Student row yet", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/admission-inquiries")
      .send({ campusId, childName: `Inquiry Child ${suffix}`, parentName: `Inquiry Parent ${suffix}`, parentPhone: "03001234567" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("NEW");
    inquiryId = res.body.id;

    const studentCount = await prisma.student.count({ where: { fullName: `Inquiry Child ${suffix}` } });
    expect(studentCount).toBe(0);
  });

  it("lists inquiries filtered by campus", async () => {
    const res = await asSuperAdmin().get(`/api/v1/admission-inquiries?campusId=${campusId}`);
    expect(res.status).toBe(200);
    expect(res.body.some((i: { id: string }) => i.id === inquiryId)).toBe(true);
  });

  it("marks the inquiry CONTACTED", async () => {
    const res = await asSuperAdmin().patch(`/api/v1/admission-inquiries/${inquiryId}`).send({ status: "CONTACTED", notes: "Called back, interested" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONTACTED");
  });

  it("converts the inquiry into a real Student + Parent + Admission", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/admission-inquiries/${inquiryId}/convert`)
      .send({ classId, academicYearId, studentNationalId: `CNIC-STU-${suffix}`, parentNationalId: `CNIC-PARENT-${suffix}` });
    expect(res.status).toBe(201);
    convertedStudentId = res.body.studentId;
    convertedParentId = res.body.parentId;
    convertedAdmissionId = res.body.admissionId;
    expect(res.body.inquiry.status).toBe("CONVERTED");
    expect(res.body.inquiry.convertedStudent.id).toBe(convertedStudentId);

    const student = await prisma.student.findUniqueOrThrow({ where: { id: convertedStudentId } });
    expect(student.nationalId).toBe(`CNIC-STU-${suffix}`);
    const link = await prisma.studentParent.findUnique({ where: { studentId_parentId: { studentId: convertedStudentId, parentId: convertedParentId } } });
    expect(link).not.toBeNull();
  });

  it("refuses converting an already-converted inquiry", async () => {
    const res = await asSuperAdmin().post(`/api/v1/admission-inquiries/${inquiryId}/convert`).send({ classId, academicYearId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ALREADY_CONVERTED");
  });

  it("refuses creating a duplicate student by nationalId during a second conversion", async () => {
    const secondInquiry = await asSuperAdmin()
      .post("/api/v1/admission-inquiries")
      .send({ campusId, childName: "Someone Else", parentName: "Someone Else Parent", parentPhone: "03009999999" });
    const res = await asSuperAdmin()
      .post(`/api/v1/admission-inquiries/${secondInquiry.body.id}/convert`)
      .send({ classId, academicYearId, studentNationalId: `CNIC-STU-${suffix}` });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("STUDENT_EXISTS_WITH_THIS_ID");

    await prisma.admissionInquiry.delete({ where: { id: secondInquiry.body.id } }).catch(() => {});
  });
});
