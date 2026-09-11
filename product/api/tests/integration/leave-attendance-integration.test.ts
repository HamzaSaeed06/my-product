import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Phase 3's markAttendance deferred "approved leave auto-marks LEAVE, not
// ABSENT" until Phase 6 introduced the Leave model — this verifies that
// deferred integration actually works end-to-end.
const suffix = uniqueSuffix();
let campusId: string;
let classId: string;
let academicYearId: string;
let sectionId: string;
let studentOnLeaveId: string;
let studentPresentId: string;
let leaveId: string;

describe("Leave -> Attendance integration (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, klass, year, studentOnLeave, studentPresent] = await Promise.all([
      prisma.campus.create({ data: { name: `LeaveAttend-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `LeaveAttend-Test Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `LeaveAttend-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.student.create({ data: { studentCode: `STU-LVATT-A-${suffix}`, fullName: `Leave Attend On Leave ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-LVATT-B-${suffix}`, fullName: `Leave Attend Present ${suffix}` } }),
    ]);
    campusId = campus.id;
    classId = klass.id;
    academicYearId = year.id;
    studentOnLeaveId = studentOnLeave.id;
    studentPresentId = studentPresent.id;

    const section = await prisma.section.create({ data: { classId, campusId, academicYearId, name: "A" } });
    sectionId = section.id;

    await Promise.all([
      prisma.enrollment.create({ data: { studentId: studentOnLeaveId, academicYearId, classId, sectionId } }),
      prisma.enrollment.create({ data: { studentId: studentPresentId, academicYearId, classId, sectionId } }),
    ]);

    const leaveRes = await asSuperAdmin()
      .post("/api/v1/leaves")
      .send({ subjectType: "STUDENT", studentId: studentOnLeaveId, fromDate: "2026-09-14", toDate: "2026-09-14", reason: "Fever" });
    if (leaveRes.status !== 201) throw new Error(`Fixture setup failed: leave creation returned ${leaveRes.status}`);
    leaveId = leaveRes.body.id;

    const decideRes = await asSuperAdmin().post(`/api/v1/leaves/${leaveId}/decide`).send({ decision: "APPROVED" });
    if (decideRes.status !== 200) throw new Error(`Fixture setup failed: leave approval returned ${decideRes.status}`);
  });

  afterAll(async () => {
    if (sectionId) await prisma.attendance.deleteMany({ where: { sectionId } }).catch(() => {});
    if (leaveId) await prisma.leave.deleteMany({ where: { id: leaveId } }).catch(() => {});
    if (sectionId) await prisma.enrollment.deleteMany({ where: { sectionId } }).catch(() => {});
    if (sectionId) await prisma.section.delete({ where: { id: sectionId } }).catch(() => {});
    if (studentOnLeaveId || studentPresentId) {
      await prisma.student.deleteMany({ where: { id: { in: [studentOnLeaveId, studentPresentId].filter(Boolean) } } }).catch(() => {});
    }
    if (classId) await prisma.class.delete({ where: { id: classId } }).catch(() => {});
    if (academicYearId) await prisma.academicYear.delete({ where: { id: academicYearId } }).catch(() => {});
    if (campusId) await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("marking a student with an approved leave as ABSENT auto-overrides to LEAVE", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/attendance")
      .send({
        sectionId,
        date: "2026-09-14",
        entries: [
          { studentId: studentOnLeaveId, status: "ABSENT" },
          { studentId: studentPresentId, status: "ABSENT" },
        ],
      });
    expect(res.status).toBe(201);

    const onLeaveRecord = res.body.find((r: { studentId: string }) => r.studentId === studentOnLeaveId);
    const presentRecord = res.body.find((r: { studentId: string }) => r.studentId === studentPresentId);
    expect(onLeaveRecord.status).toBe("LEAVE");
    expect(presentRecord.status).toBe("ABSENT");
  });
});
