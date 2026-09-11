import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { markAttendance } from "../../src/modules/attendance/service.js";

const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let subjectId: string;
let studentAId: string;
let studentBId: string;
let outsideStudentId: string;
let assignedTeacherUserId: string;
let assignedTeacherId: string;
let unassignedTeacherUserId: string;
let unassignedTeacherId: string;
let attendanceAId: string;
let approvalId: string;

describe("Attendance API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, subject, studentA, studentB, outsideStudent, assignedUser, unassignedUser] = await Promise.all([
      prisma.campus.create({ data: { name: `Att-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Att-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Att-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.subject.create({ data: { name: `Att-Test Subject ${suffix}`, instituteId: institute.id } }),
      prisma.student.create({ data: { studentCode: `STU-ATT-A-${suffix}`, fullName: `Attendance Test A ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-ATT-B-${suffix}`, fullName: `Attendance Test B ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-ATT-OUT-${suffix}`, fullName: `Attendance Test Outside ${suffix}` } }),
      prisma.user.create({ data: { email: `att-teacher-${suffix}@example.test`, passwordHash: "x", fullName: "Att Assigned Teacher" } }),
      prisma.user.create({ data: { email: `att-teacher-unassigned-${suffix}@example.test`, passwordHash: "x", fullName: "Att Unassigned Teacher" } }),
    ]);

    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    subjectId = subject.id;
    studentAId = studentA.id;
    studentBId = studentB.id;
    outsideStudentId = outsideStudent.id;
    assignedTeacherUserId = assignedUser.id;
    unassignedTeacherUserId = unassignedUser.id;

    const section = await prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } });
    sectionId = section.id;

    const [assignedTeacher, unassignedTeacher] = await Promise.all([
      prisma.teacher.create({ data: { userId: assignedTeacherUserId } }),
      prisma.teacher.create({ data: { userId: unassignedTeacherUserId } }),
    ]);
    assignedTeacherId = assignedTeacher.id;
    unassignedTeacherId = unassignedTeacher.id;

    await Promise.all([
      prisma.teacherAssignment.create({ data: { teacherId: assignedTeacherId, subjectId, classId, sectionId, academicYearId } }),
      prisma.enrollment.create({ data: { studentId: studentAId, academicYearId, classId, sectionId } }),
      prisma.enrollment.create({ data: { studentId: studentBId, academicYearId, classId, sectionId } }),
    ]);
  });

  afterAll(async () => {
    await prisma.approvalRequest.deleteMany({ where: { resource: "Attendance", recordId: attendanceAId } });
    await prisma.attendance.deleteMany({ where: { sectionId } });
    await prisma.enrollment.deleteMany({ where: { sectionId } });
    await prisma.teacherAssignment.deleteMany({ where: { sectionId } });
    await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    await prisma.teacher.deleteMany({ where: { id: { in: [assignedTeacherId, unassignedTeacherId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [assignedTeacherUserId, unassignedTeacherUserId] } } });
    await prisma.student.deleteMany({ where: { id: { in: [studentAId, studentBId, outsideStudentId] } } });
    await prisma.subject.delete({ where: { id: subjectId } }).catch(() => {});
    await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("refuses marking attendance for a student not enrolled in the section", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/attendance")
      .send({ sectionId, date: "2026-09-14", entries: [{ studentId: outsideStudentId, status: "PRESENT" }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("STUDENT_NOT_ENROLLED");
  });

  it("blocks a teacher not assigned to the section from marking attendance (direct service check)", async () => {
    await expect(
      markAttendance(
        { sectionId, date: "2026-09-14", entries: [{ studentId: studentAId, status: "PRESENT" }] },
        unassignedTeacherUserId
      )
    ).rejects.toMatchObject({ code: "NOT_ASSIGNED_TO_SECTION" });
  });

  it("marks attendance for enrolled students", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/attendance")
      .send({
        sectionId,
        date: "2026-09-14",
        entries: [
          { studentId: studentAId, status: "PRESENT" },
          { studentId: studentBId, status: "ABSENT" },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(2);
    attendanceAId = res.body.find((r: { studentId: string }) => r.studentId === studentAId).id;
  });

  it("refuses re-marking attendance already marked for that date", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/attendance")
      .send({ sectionId, date: "2026-09-14", entries: [{ studentId: studentAId, status: "ABSENT" }] });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ATTENDANCE_ALREADY_MARKED");
  });

  it("lists attendance filtered by section and date", async () => {
    const res = await asSuperAdmin().get(`/api/v1/attendance?sectionId=${sectionId}&date=2026-09-14`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("refuses a correction request with no actual change", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/attendance/${attendanceAId}/request-correction`)
      .send({ newStatus: "PRESENT", reason: "no-op" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("NO_CHANGE");
  });

  it("requests an attendance correction", async () => {
    const res = await asSuperAdmin()
      .post(`/api/v1/attendance/${attendanceAId}/request-correction`)
      .send({ newStatus: "ABSENT", reason: "Marked present by mistake" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(res.body.type).toBe("ATTENDANCE_CORRECTION");
    approvalId = res.body.id;
  });

  it("approves the correction, which updates the underlying attendance row", async () => {
    const res = await asSuperAdmin().post(`/api/v1/attendance/corrections/${approvalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);

    const attendance = await prisma.attendance.findUnique({ where: { id: attendanceAId } });
    expect(attendance?.status).toBe("ABSENT");
  });

  it("refuses deciding an already-decided correction", async () => {
    const res = await asSuperAdmin().post(`/api/v1/attendance/corrections/${approvalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("APPROVAL_ALREADY_DECIDED");
  });
});
