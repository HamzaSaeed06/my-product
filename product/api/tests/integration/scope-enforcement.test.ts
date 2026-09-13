import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, createTestUserWithRole, loginAsTestUser, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

// Phase 7's core acceptance criteria, verified directly against the real
// database and real HTTP layer (not unit-testing scope.ts in isolation):
// "Teacher sees only assigned classes", "Parent sees only own children",
// "Incharge sees only scoped data", "Student sees only own data".
const suffix = uniqueSuffix();
const PASSWORD = "Str0ng!Passw0rd1";

let campusId: string;
let academicYearId: string;
let classInId: string;
let classOutId: string;
let sectionInId: string;
let sectionOutId: string;
let subjectId: string;

let studentInId: string; // in every actor's scope
let studentOutId: string; // outside every actor's scope

let teacherUserId: string;
let teacherId: string;
let teacherClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let teacherOutUserId: string; // assigned only to sectionOut (outside Incharge scope)
let teacherOutId: string;

let parentUserId: string;
let parentId: string;
let parentClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let studentUserId: string; // logs in AS studentInId
let studentClient: Awaited<ReturnType<typeof loginAsTestUser>>;

let inchargeUserId: string;
let inchargeScopeId: string;
let inchargeClient: Awaited<ReturnType<typeof loginAsTestUser>>;

describe("Phase 7 scope enforcement (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, year, classIn, classOut, subject] = await Promise.all([
      prisma.campus.create({ data: { name: `Scope-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Scope-Test-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.class.create({ data: { name: `Scope-Test Class In ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Scope-Test Class Out ${suffix}`, instituteId: institute.id } }),
      prisma.subject.create({ data: { name: `Scope-Test Subject ${suffix}`, code: `SCP-${suffix}`, instituteId: institute.id } }),
    ]);
    campusId = campus.id;
    academicYearId = year.id;
    classInId = classIn.id;
    classOutId = classOut.id;
    subjectId = subject.id;

    const [sectionIn, sectionOut] = await Promise.all([
      prisma.section.create({ data: { classId: classInId, campusId, academicYearId, name: "A" } }),
      prisma.section.create({ data: { classId: classOutId, campusId, academicYearId, name: "A" } }),
    ]);
    sectionInId = sectionIn.id;
    sectionOutId = sectionOut.id;

    const [studentIn, studentOut] = await Promise.all([
      prisma.student.create({ data: { studentCode: `STU-SCOPE-IN-${suffix}`, fullName: `Scope In ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-SCOPE-OUT-${suffix}`, fullName: `Scope Out ${suffix}` } }),
    ]);
    studentInId = studentIn.id;
    studentOutId = studentOut.id;

    await Promise.all([
      prisma.enrollment.create({ data: { studentId: studentInId, academicYearId, classId: classInId, sectionId: sectionInId } }),
      prisma.enrollment.create({ data: { studentId: studentOutId, academicYearId, classId: classOutId, sectionId: sectionOutId } }),
    ]);

    // Teacher — assigned to sectionIn only.
    const teacherUser = await createTestUserWithRole({
      email: `scope-teacher-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Scope Teacher",
      roleName: "TEACHER",
    });
    teacherUserId = teacherUser.id;
    const teacher = await prisma.teacher.create({ data: { userId: teacherUserId } });
    teacherId = teacher.id;
    await prisma.teacherAssignment.create({
      data: { teacherId, subjectId, classId: classInId, sectionId: sectionInId, academicYearId },
    });
    teacherClient = await loginAsTestUser(teacherUser.email, PASSWORD);

    // A second teacher — assigned only to sectionOut (outside the Incharge's
    // scoped class), so we can prove the Incharge's teacher list excludes them.
    const teacherOutUser = await createTestUserWithRole({
      email: `scope-teacher-out-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Scope Teacher Out",
      roleName: "TEACHER",
    });
    teacherOutUserId = teacherOutUser.id;
    const teacherOut = await prisma.teacher.create({ data: { userId: teacherOutUserId } });
    teacherOutId = teacherOut.id;
    await prisma.teacherAssignment.create({
      data: { teacherId: teacherOutId, subjectId, classId: classOutId, sectionId: sectionOutId, academicYearId },
    });

    // Parent — linked to studentIn only.
    const parentUser = await createTestUserWithRole({
      email: `scope-parent-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Scope Parent",
      roleName: "PARENT",
    });
    parentUserId = parentUser.id;
    const parent = await prisma.parent.create({ data: { fullName: "Scope Parent", phone: "555-0100", userId: parentUserId } });
    parentId = parent.id;
    await prisma.studentParent.create({ data: { studentId: studentInId, parentId, relationship: "Mother", isPrimary: true } });
    parentClient = await loginAsTestUser(parentUser.email, PASSWORD);

    // Student — logs in AS studentIn.
    const studentUser = await createTestUserWithRole({
      email: `scope-student-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Scope Student",
      roleName: "STUDENT",
    });
    studentUserId = studentUser.id;
    await prisma.student.update({ where: { id: studentInId }, data: { userId: studentUserId } });
    studentClient = await loginAsTestUser(studentUser.email, PASSWORD);

    // Incharge — scoped to classIn only.
    const inchargeUser = await createTestUserWithRole({
      email: `scope-incharge-${suffix}@example.test`,
      password: PASSWORD,
      fullName: "Scope Incharge",
      roleName: "INCHARGE",
    });
    inchargeUserId = inchargeUser.id;
    const inchargeScope = await prisma.inchargeScope.create({
      data: { userId: inchargeUserId, campusId, academicYearId, createdBy: asSuperAdmin().userId },
    });
    inchargeScopeId = inchargeScope.id;
    await prisma.inchargeScopeClass.create({ data: { inchargeScopeId, classId: classInId } });
    inchargeClient = await loginAsTestUser(inchargeUser.email, PASSWORD);
  }, 60000);

  afterAll(async () => {
    if (inchargeScopeId) await prisma.inchargeScope.deleteMany({ where: { id: inchargeScopeId } }).catch(() => {});
    if (inchargeUserId) await prisma.user.deleteMany({ where: { id: inchargeUserId } }).catch(() => {});
    if (teacherId) await prisma.teacherAssignment.deleteMany({ where: { teacherId } }).catch(() => {});
    if (teacherId) await prisma.teacher.deleteMany({ where: { id: teacherId } }).catch(() => {});
    if (teacherUserId) await prisma.user.deleteMany({ where: { id: teacherUserId } }).catch(() => {});
    if (teacherOutId) await prisma.teacherAssignment.deleteMany({ where: { teacherId: teacherOutId } }).catch(() => {});
    if (teacherOutId) await prisma.teacher.deleteMany({ where: { id: teacherOutId } }).catch(() => {});
    if (teacherOutUserId) await prisma.user.deleteMany({ where: { id: teacherOutUserId } }).catch(() => {});
    if (parentId) await prisma.studentParent.deleteMany({ where: { parentId } }).catch(() => {});
    if (parentId) await prisma.parent.deleteMany({ where: { id: parentId } }).catch(() => {});
    if (parentUserId) await prisma.user.deleteMany({ where: { id: parentUserId } }).catch(() => {});
    if (studentUserId) await prisma.user.deleteMany({ where: { id: studentUserId } }).catch(() => {});
    if (studentInId || studentOutId) {
      await prisma.enrollment.deleteMany({ where: { studentId: { in: [studentInId, studentOutId].filter(Boolean) } } }).catch(() => {});
      await prisma.student.deleteMany({ where: { id: { in: [studentInId, studentOutId].filter(Boolean) } } }).catch(() => {});
    }
    if (sectionInId || sectionOutId) {
      await prisma.section.deleteMany({ where: { id: { in: [sectionInId, sectionOutId].filter(Boolean) } } }).catch(() => {});
    }
    if (subjectId) await prisma.subject.deleteMany({ where: { id: subjectId } }).catch(() => {});
    if (classInId || classOutId) {
      await prisma.class.deleteMany({ where: { id: { in: [classInId, classOutId].filter(Boolean) } } }).catch(() => {});
    }
    if (academicYearId) await prisma.academicYear.deleteMany({ where: { id: academicYearId } }).catch(() => {});
    if (campusId) await prisma.campus.deleteMany({ where: { id: campusId } }).catch(() => {});
  });

  describe("Teacher — sees only assigned classes", () => {
    it("allows listing homework for their assigned section", async () => {
      const res = await teacherClient.get(`/api/v1/homework?sectionId=${sectionInId}`);
      expect(res.status).toBe(200);
    });

    it("refuses listing homework for a section they're not assigned to", async () => {
      const res = await teacherClient.get(`/api/v1/homework?sectionId=${sectionOutId}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });

    it("requires a sectionId at all (no unscoped 'everything' listing)", async () => {
      const res = await teacherClient.get(`/api/v1/homework`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("SECTION_REQUIRED");
    });

    // Phase 11 Phase D: createHomeworkHandler previously had no scope check
    // at all — any actor holding homework.create could post to any
    // section by just knowing its id. Verified fixed here.
    it("refuses creating homework for a section they're not assigned to", async () => {
      const res = await teacherClient
        .post("/api/v1/homework")
        .send({ subjectId, sectionId: sectionOutId, classId: classOutId, teacherId, title: "Should be refused", dueDate: "2026-09-20" });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });

    it("allows creating homework for their own assigned section", async () => {
      const res = await teacherClient
        .post("/api/v1/homework")
        .send({ subjectId, sectionId: sectionInId, classId: classInId, teacherId, title: "Scope Test Homework", dueDate: "2026-09-20" });
      expect(res.status).toBe(201);
      await prisma.homework.delete({ where: { id: res.body.id } }).catch(() => {});
    });

    // Same underlying scope check, new Phase D module.
    it("refuses posting a class diary entry for a section they're not assigned to", async () => {
      const res = await teacherClient
        .post("/api/v1/class-diary")
        .send({ sectionId: sectionOutId, teacherId, date: "2026-09-12", note: "Should be refused" });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });

    it("allows posting a class diary entry for their own assigned section", async () => {
      const res = await teacherClient
        .post("/api/v1/class-diary")
        .send({ sectionId: sectionInId, teacherId, date: "2026-09-12", note: "Scope Test Diary Entry" });
      expect(res.status).toBe(201);
      await prisma.classDiaryEntry.delete({ where: { id: res.body.id } }).catch(() => {});
    });
  });

  describe("Parent — sees only own children", () => {
    it("allows fetching their own child's profile", async () => {
      const res = await parentClient.get(`/api/v1/students/${studentInId}`);
      expect(res.status).toBe(200);
    });

    it("refuses fetching a student who isn't their child", async () => {
      const res = await parentClient.get(`/api/v1/students/${studentOutId}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });

    it("lists only their own children when no filter is given", async () => {
      const res = await parentClient.get(`/api/v1/students`);
      expect(res.status).toBe(200);
      const ids = res.body.map((s: { id: string }) => s.id);
      expect(ids).toContain(studentInId);
      expect(ids).not.toContain(studentOutId);
    });

    it("refuses listing invoices for a non-child student", async () => {
      const res = await parentClient.get(`/api/v1/invoices?studentId=${studentOutId}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });
  });

  describe("Student — sees only own data", () => {
    it("allows fetching their own profile", async () => {
      const res = await studentClient.get(`/api/v1/students/${studentInId}`);
      expect(res.status).toBe(200);
    });

    it("refuses fetching another student's profile", async () => {
      const res = await studentClient.get(`/api/v1/students/${studentOutId}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });

    it("scopes an unfiltered attendance list to just themselves", async () => {
      const res = await studentClient.get(`/api/v1/attendance`);
      expect(res.status).toBe(200);
      expect(res.body.every((a: { studentId: string }) => a.studentId === studentInId)).toBe(true);
    });
  });

  describe("Incharge — sees only scoped data", () => {
    it("allows listing homework for a section in their scoped class", async () => {
      const res = await inchargeClient.get(`/api/v1/homework?sectionId=${sectionInId}`);
      expect(res.status).toBe(200);
    });

    it("refuses listing homework for a section outside their scoped class", async () => {
      const res = await inchargeClient.get(`/api/v1/homework?sectionId=${sectionOutId}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("OUT_OF_SCOPE");
    });

    // Regression: GET /sections previously returned every section in the
    // institute for an Incharge (campusIds empty → unfiltered). Now narrowed
    // to their scoped sections only.
    it("lists only sections within their scope (not the whole institute)", async () => {
      const res = await inchargeClient.get(`/api/v1/sections`);
      expect(res.status).toBe(200);
      const ids = res.body.map((s: { id: string }) => s.id);
      expect(ids).toContain(sectionInId);
      expect(ids).not.toContain(sectionOutId);
    });

    // Regression: GET /teachers previously returned every teacher in the
    // institute for an Incharge. Now narrowed to teachers assigned to a
    // section their scope covers.
    it("lists only teachers assigned within their scope (not the whole institute)", async () => {
      const res = await inchargeClient.get(`/api/v1/teachers`);
      expect(res.status).toBe(200);
      const ids = res.body.map((t: { id: string }) => t.id);
      expect(ids).toContain(teacherId);
      expect(ids).not.toContain(teacherOutId);
    });

    // Regression: GET /homework with no sectionId previously 500'd for an
    // Incharge (SECTION_REQUIRED, campusIds empty). Now returns homework
    // across their scoped sections, and only those.
    it("lists homework across their scope without a sectionId (no 500), scoped correctly", async () => {
      const [hwIn, hwOut] = await Promise.all([
        prisma.homework.create({
          data: { subjectId, sectionId: sectionInId, classId: classInId, teacherId, title: `HW In ${suffix}`, dueDate: new Date("2026-09-20") },
        }),
        prisma.homework.create({
          data: { subjectId, sectionId: sectionOutId, classId: classOutId, teacherId: teacherOutId, title: `HW Out ${suffix}`, dueDate: new Date("2026-09-20") },
        }),
      ]);

      const res = await inchargeClient.get(`/api/v1/homework`);
      expect(res.status).toBe(200);
      const ids = res.body.map((h: { id: string }) => h.id);
      expect(ids).toContain(hwIn.id);
      expect(ids).not.toContain(hwOut.id);

      await prisma.homework.deleteMany({ where: { id: { in: [hwIn.id, hwOut.id] } } }).catch(() => {});
    });
  });
});
