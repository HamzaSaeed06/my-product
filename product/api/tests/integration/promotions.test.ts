import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let campusId: string;
let fromClassId: string;
let toClassId: string;
let fromYearId: string;
let toYearId: string;
let fromSectionId: string;
let toSectionId: string;

let studentPromoteId: string;
let enrollmentPromoteId: string;
let studentJumpId: string;
let enrollmentJumpId: string;
let studentPendingId: string;
let enrollmentPendingId: string;

let promotionJumpId: string;
let jumpApprovalId: string;

describe("Promotions API (real database)", () => {
  beforeAll(async () => {
    const institute = await prisma.institute.findFirstOrThrow();

    const [campus, fromClass, toClass, fromYear, toYear, studentPromote, studentJump, studentPending] = await Promise.all([
      prisma.campus.create({ data: { name: `Promo-Test Campus ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Promo-Test From Class ${suffix}`, instituteId: institute.id } }),
      prisma.class.create({ data: { name: `Promo-Test To Class ${suffix}`, instituteId: institute.id } }),
      prisma.academicYear.create({
        data: { name: `Promo-Test-From-Year-${suffix}`, startDate: new Date("2025-08-01"), endDate: new Date("2026-07-31"), instituteId: institute.id },
      }),
      prisma.academicYear.create({
        data: { name: `Promo-Test-To-Year-${suffix}`, startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31"), instituteId: institute.id },
      }),
      prisma.student.create({ data: { studentCode: `STU-PROMO-${suffix}`, fullName: `Promo Test ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-JUMP-${suffix}`, fullName: `Jump Test ${suffix}` } }),
      prisma.student.create({ data: { studentCode: `STU-PEND-${suffix}`, fullName: `Pending Test ${suffix}` } }),
    ]);

    campusId = campus.id;
    fromClassId = fromClass.id;
    toClassId = toClass.id;
    fromYearId = fromYear.id;
    toYearId = toYear.id;
    studentPromoteId = studentPromote.id;
    studentJumpId = studentJump.id;
    studentPendingId = studentPending.id;

    const [fromSection, toSection] = await Promise.all([
      prisma.section.create({ data: { classId: fromClassId, campusId, academicYearId: fromYearId, name: "A" } }),
      prisma.section.create({ data: { classId: toClassId, campusId, academicYearId: toYearId, name: "A" } }),
    ]);
    fromSectionId = fromSection.id;
    toSectionId = toSection.id;

    const [enrollmentPromote, enrollmentJump, enrollmentPending] = await Promise.all([
      prisma.enrollment.create({ data: { studentId: studentPromoteId, academicYearId: fromYearId, classId: fromClassId, sectionId: fromSectionId } }),
      prisma.enrollment.create({ data: { studentId: studentJumpId, academicYearId: fromYearId, classId: fromClassId, sectionId: fromSectionId } }),
      prisma.enrollment.create({ data: { studentId: studentPendingId, academicYearId: fromYearId, classId: fromClassId, sectionId: fromSectionId } }),
    ]);
    enrollmentPromoteId = enrollmentPromote.id;
    enrollmentJumpId = enrollmentJump.id;
    enrollmentPendingId = enrollmentPending.id;
  });

  // Guards every cleanup step against beforeAll having crashed partway
  // through (fixture variables can be undefined) — a crashed beforeAll
  // should surface its own real error, not a secondary
  // "undefined value within array" validation error from afterAll that
  // masks it. See docs/PROJECT_STATUS.md §5a.
  afterAll(async () => {
    const definedIds = (ids: (string | undefined)[]) => ids.filter((id): id is string => Boolean(id));

    if (toYearId) await prisma.promotion.deleteMany({ where: { academicYearId: toYearId } }).catch(() => {});
    const sectionIds = definedIds([fromSectionId, toSectionId]);
    if (sectionIds.length) {
      await prisma.enrollment.deleteMany({ where: { sectionId: { in: sectionIds } } }).catch(() => {});
      await prisma.section.deleteMany({ where: { id: { in: sectionIds } } }).catch(() => {});
    }
    const studentIds = definedIds([studentPromoteId, studentJumpId, studentPendingId]);
    if (studentIds.length) {
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } }).catch(() => {});
    }
    const yearIds = definedIds([fromYearId, toYearId]);
    if (yearIds.length) {
      await prisma.academicYear.deleteMany({ where: { id: { in: yearIds } } }).catch(() => {});
    }
    const classIds = definedIds([fromClassId, toClassId]);
    if (classIds.length) {
      await prisma.class.deleteMany({ where: { id: { in: classIds } } }).catch(() => {});
    }
    if (campusId) await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("refuses an enrollment that doesn't belong to the given student", async () => {
    const res = await asSuperAdmin().post("/api/v1/promotions").send({
      studentId: studentJumpId,
      fromEnrollmentId: enrollmentPromoteId,
      academicYearId: toYearId,
      targetClassId: toClassId,
      targetSectionId: toSectionId,
      decision: "PROMOTE",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ENROLLMENT_NOT_FOUND");
  });

  it("creates a PROMOTE decision and executes immediately", async () => {
    const res = await asSuperAdmin().post("/api/v1/promotions").send({
      studentId: studentPromoteId,
      fromEnrollmentId: enrollmentPromoteId,
      academicYearId: toYearId,
      targetClassId: toClassId,
      targetSectionId: toSectionId,
      decision: "PROMOTE",
    });
    expect(res.status).toBe(201);
    expect(res.body.executedAt).not.toBeNull();
    expect(res.body.newEnrollmentId).not.toBeNull();

    const newEnrollment = await prisma.enrollment.findUnique({ where: { id: res.body.newEnrollmentId } });
    expect(newEnrollment?.status).toBe("ACTIVE");
    expect(newEnrollment?.classId).toBe(toClassId);

    const oldEnrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentPromoteId } });
    expect(oldEnrollment?.status).toBe("ACTIVE"); // promotion doesn't retroactively change the prior year's record
  });

  it("refuses a class jump without a reason", async () => {
    const res = await asSuperAdmin().post("/api/v1/promotions").send({
      studentId: studentJumpId,
      fromEnrollmentId: enrollmentJumpId,
      academicYearId: toYearId,
      targetClassId: toClassId,
      targetSectionId: toSectionId,
      decision: "CLASS_JUMP",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("REASON_REQUIRED");
  });

  it("creates a CLASS_JUMP decision, which does not execute immediately", async () => {
    const res = await asSuperAdmin().post("/api/v1/promotions").send({
      studentId: studentJumpId,
      fromEnrollmentId: enrollmentJumpId,
      academicYearId: toYearId,
      targetClassId: toClassId,
      targetSectionId: toSectionId,
      decision: "CLASS_JUMP",
      reason: "Exceptional performance",
    });
    expect(res.status).toBe(201);
    expect(res.body.executedAt).toBeNull();
    expect(res.body.newEnrollmentId).toBeNull();
    promotionJumpId = res.body.id;

    const approval = await prisma.approvalRequest.findFirstOrThrow({ where: { type: "PROMOTION_CLASS_JUMP", recordId: promotionJumpId } });
    jumpApprovalId = approval.id;
    expect(approval.status).toBe("PENDING");
  });

  it("a PENDING decision never executes", async () => {
    const res = await asSuperAdmin().post("/api/v1/promotions").send({
      studentId: studentPendingId,
      fromEnrollmentId: enrollmentPendingId,
      academicYearId: toYearId,
      targetClassId: toClassId,
      targetSectionId: toSectionId,
      decision: "PENDING",
    });
    expect(res.status).toBe(201);
    expect(res.body.executedAt).toBeNull();
    expect(res.body.newEnrollmentId).toBeNull();
  });

  it("approves the class jump, which executes the promotion", async () => {
    const res = await asSuperAdmin().post(`/api/v1/promotions/class-jump/${jumpApprovalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(200);

    const promotion = await prisma.promotion.findUniqueOrThrow({ where: { id: promotionJumpId } });
    expect(promotion.executedAt).not.toBeNull();
    expect(promotion.newEnrollmentId).not.toBeNull();
  });

  it("refuses re-deciding an already-decided class jump", async () => {
    const res = await asSuperAdmin().post(`/api/v1/promotions/class-jump/${jumpApprovalId}/decide`).send({ decision: "APPROVED" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("APPROVAL_ALREADY_DECIDED");
  });

  it("lists promotions filtered by target academic year", async () => {
    const res = await asSuperAdmin().get(`/api/v1/promotions?academicYearId=${toYearId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });
});
