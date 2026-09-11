import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";

// Phase 8: predefined reports, computed live from Phase 1-7's real data —
// no new persistent models (nothing here is stored; every number is
// recomputed from the source tables on each request). Deliberately out of
// scope per spec's own note: a custom report builder, and (needing a job
// scheduler this app doesn't have) "auto-generate daily/weekly/monthly" —
// both documented deferrals, not oversights.
//
// A student "passes" at >=40% — not defined anywhere else in the schema
// (Result/ResultItem just store raw marks), so this is this report
// module's own choice, kept in one place (PASS_THRESHOLD) rather than
// scattered as a magic number.
const PASS_THRESHOLD = 40;

function toPercentage(obtained: number, max: number): number {
  return max > 0 ? Math.round((obtained / max) * 10000) / 100 : 0;
}

// ─────────────────────────────────────────────────────────────────────────
// Academic Reports
// ─────────────────────────────────────────────────────────────────────────

export async function getAcademicReport(filter: { examId: string; sectionId?: string }) {
  const exam = await prisma.exam.findUnique({ where: { id: filter.examId } });
  if (!exam) throw new HttpError(400, "EXAM_NOT_FOUND", "Exam not found");

  const results = await prisma.result.findMany({
    where: { examId: filter.examId, sectionId: filter.sectionId, status: { in: ["FINALIZED", "PUBLISHED"] } },
    include: {
      student: { select: { id: true, fullName: true, studentCode: true } },
      section: { include: { class: true } },
      items: { include: { subject: true } },
    },
  });

  const studentPerformance = results.map((r) => {
    const obtained = r.items.reduce((sum, i) => sum + i.marksObtained, 0);
    const max = r.items.reduce((sum, i) => sum + i.totalMarks, 0);
    const percentage = toPercentage(obtained, max);
    return {
      studentId: r.student.id,
      studentName: r.student.fullName,
      studentCode: r.student.studentCode,
      sectionId: r.sectionId,
      sectionName: `${r.section.class.name} ${r.section.name}`,
      percentage,
      passed: percentage >= PASS_THRESHOLD,
    };
  });

  const classPerfBySection = new Map<string, { sectionName: string; sum: number; count: number }>();
  const subjectAgg = new Map<string, { name: string; sumObtained: number; sumMax: number; entries: number }>();
  const sectionSubjectAgg = new Map<string, { sumObtained: number; sumMax: number }>();

  for (const r of results) {
    const sectionLabel = `${r.section.class.name} ${r.section.name}`;
    const sp = studentPerformance.find((s) => s.studentId === r.student.id)!;
    const classEntry = classPerfBySection.get(r.sectionId) ?? { sectionName: sectionLabel, sum: 0, count: 0 };
    classEntry.sum += sp.percentage;
    classEntry.count += 1;
    classPerfBySection.set(r.sectionId, classEntry);

    for (const item of r.items) {
      const subjEntry = subjectAgg.get(item.subjectId) ?? { name: item.subject.name, sumObtained: 0, sumMax: 0, entries: 0 };
      subjEntry.sumObtained += item.marksObtained;
      subjEntry.sumMax += item.totalMarks;
      subjEntry.entries += 1;
      subjectAgg.set(item.subjectId, subjEntry);

      const key = `${r.sectionId}:${item.subjectId}`;
      const ssEntry = sectionSubjectAgg.get(key) ?? { sumObtained: 0, sumMax: 0 };
      ssEntry.sumObtained += item.marksObtained;
      ssEntry.sumMax += item.totalMarks;
      sectionSubjectAgg.set(key, ssEntry);
    }
  }

  const classPerformance = [...classPerfBySection.entries()].map(([sectionId, v]) => ({
    sectionId,
    sectionName: v.sectionName,
    averagePercentage: Math.round((v.sum / v.count) * 100) / 100,
    studentCount: v.count,
  }));

  const subjectWiseAnalysis = [...subjectAgg.entries()].map(([subjectId, v]) => ({
    subjectId,
    subjectName: v.name,
    averagePercentage: toPercentage(v.sumObtained, v.sumMax),
    entries: v.entries,
  }));

  const passedCount = studentPerformance.filter((s) => s.passed).length;
  const passFailRates = {
    passed: passedCount,
    failed: studentPerformance.length - passedCount,
    passRatePercentage: studentPerformance.length > 0 ? Math.round((passedCount / studentPerformance.length) * 10000) / 100 : 0,
  };

  const sectionIds = [...new Set(results.map((r) => r.sectionId))];
  const assignments = sectionIds.length
    ? await prisma.teacherAssignment.findMany({
        where: { sectionId: { in: sectionIds }, archivedAt: null },
        include: { teacher: { include: { user: true } }, subject: true },
      })
    : [];
  const teacherPerformance = assignments.map((a) => {
    const key = `${a.sectionId}:${a.subjectId}`;
    const agg = sectionSubjectAgg.get(key);
    return {
      teacherId: a.teacherId,
      teacherName: a.teacher.user.fullName,
      subjectName: a.subject.name,
      sectionId: a.sectionId,
      averagePercentage: agg ? toPercentage(agg.sumObtained, agg.sumMax) : null,
    };
  });

  const curriculumRows = sectionIds.length
    ? await prisma.curriculumProgress.findMany({
        where: { sectionId: { in: sectionIds } },
        include: { curriculum: true },
      })
    : [];
  const curriculumBySection = new Map<string, { total: number; completed: number }>();
  for (const row of curriculumRows) {
    const entry = curriculumBySection.get(row.sectionId) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (row.completedAt) entry.completed += 1;
    curriculumBySection.set(row.sectionId, entry);
  }
  const curriculumProgress = [...curriculumBySection.entries()].map(([sectionId, v]) => ({
    sectionId,
    totalTopics: v.total,
    completedTopics: v.completed,
    completionPercentage: v.total > 0 ? Math.round((v.completed / v.total) * 10000) / 100 : 0,
  }));

  return {
    examId: filter.examId,
    examName: exam.name,
    studentPerformance,
    classPerformance,
    subjectWiseAnalysis,
    teacherPerformance,
    curriculumProgress,
    passFailRates,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Attendance Reports
// ─────────────────────────────────────────────────────────────────────────

export async function getAttendanceReport(filter: {
  dateFrom: Date;
  dateTo: Date;
  sectionId?: string;
  classId?: string;
  campusId?: string;
}) {
  const sectionWhere: Prisma.SectionWhereInput = {};
  if (filter.sectionId) sectionWhere.id = filter.sectionId;
  if (filter.classId) sectionWhere.classId = filter.classId;
  if (filter.campusId) sectionWhere.campusId = filter.campusId;
  const matchingSectionIds =
    filter.sectionId || filter.classId || filter.campusId
      ? (await prisma.section.findMany({ where: sectionWhere, select: { id: true } })).map((s) => s.id)
      : undefined;

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: filter.dateFrom, lte: filter.dateTo },
      sectionId: matchingSectionIds ? { in: matchingSectionIds } : undefined,
    },
    include: { student: { select: { id: true, fullName: true, studentCode: true } } },
  });

  const dailyMap = new Map<string, { present: number; absent: number; leave: number }>();
  const studentMap = new Map<string, { name: string; code: string; present: number; absent: number; leave: number }>();
  const sectionMap = new Map<string, { present: number; absent: number; leave: number }>();

  for (const r of records) {
    const dateKey = r.date.toISOString().slice(0, 10);
    const day = dailyMap.get(dateKey) ?? { present: 0, absent: 0, leave: 0 };
    const student = studentMap.get(r.studentId) ?? { name: r.student.fullName, code: r.student.studentCode, present: 0, absent: 0, leave: 0 };
    const section = sectionMap.get(r.sectionId) ?? { present: 0, absent: 0, leave: 0 };

    if (r.status === "PRESENT") {
      day.present += 1;
      student.present += 1;
      section.present += 1;
    } else if (r.status === "ABSENT") {
      day.absent += 1;
      student.absent += 1;
      section.absent += 1;
    } else {
      day.leave += 1;
      student.leave += 1;
      section.leave += 1;
    }

    dailyMap.set(dateKey, day);
    studentMap.set(r.studentId, student);
    sectionMap.set(r.sectionId, section);
  }

  const dailyAttendance = [...dailyMap.entries()]
    .map(([date, v]) => ({ date, ...v, total: v.present + v.absent + v.leave }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const studentWise = [...studentMap.entries()].map(([studentId, v]) => {
    const total = v.present + v.absent + v.leave;
    return {
      studentId,
      studentName: v.name,
      studentCode: v.code,
      present: v.present,
      absent: v.absent,
      leave: v.leave,
      attendancePercentage: total > 0 ? toPercentage(v.present, total) : 0,
    };
  });

  const classWise = [...sectionMap.entries()].map(([sectionId, v]) => {
    const total = v.present + v.absent + v.leave;
    return { sectionId, present: v.present, absent: v.absent, leave: v.leave, attendancePercentage: total > 0 ? toPercentage(v.present, total) : 0 };
  });

  const absenceTrends = [...dailyMap.entries()]
    .map(([date, v]) => ({ date, absentCount: v.absent }))
    .sort((a, b) => b.absentCount - a.absentCount)
    .slice(0, 10);

  const totalPresent = records.filter((r) => r.status === "PRESENT").length;
  const monthlySummary = {
    totalRecords: records.length,
    present: totalPresent,
    absent: records.filter((r) => r.status === "ABSENT").length,
    leave: records.filter((r) => r.status === "LEAVE").length,
    overallAttendancePercentage: records.length > 0 ? toPercentage(totalPresent, records.length) : 0,
  };

  // Spec asks for "Late arrivals" as an attendance-report metric, but
  // AttendanceStatus is only PRESENT/ABSENT/LEAVE — no LATE state exists
  // anywhere in the schema (Phase 3 never modeled tardiness separately
  // from absence). Omitted rather than faked; documented in
  // PROJECT_STATUS.md.
  return { dailyAttendance, monthlySummary, studentWise, classWise, absenceTrends };
}

// ─────────────────────────────────────────────────────────────────────────
// Financial Reports
// ─────────────────────────────────────────────────────────────────────────

export async function getFinancialReport(filter: { dateFrom: Date; dateTo: Date; campusId?: string }) {
  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: filter.dateFrom, lte: filter.dateTo }, status: "SUCCESS" },
    include: { student: { include: { enrollments: { where: { status: "ACTIVE" }, include: { section: true }, take: 1 } } } },
  });

  const relevantPayments = filter.campusId
    ? payments.filter((p) => p.student.enrollments[0]?.section.campusId === filter.campusId)
    : payments;

  const dailyMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();
  const campusMap = new Map<string, number>();

  for (const p of relevantPayments) {
    const amount = Number(p.amount);
    const dateKey = p.createdAt.toISOString().slice(0, 10);
    const monthKey = p.createdAt.toISOString().slice(0, 7);
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + amount);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + amount);

    const campusId = p.student.enrollments[0]?.section.campusId ?? "unassigned";
    campusMap.set(campusId, (campusMap.get(campusId) ?? 0) + amount);
  }

  const dailyCollection = [...dailyMap.entries()].map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));
  const monthlyCollection = [...monthlyMap.entries()].map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month));
  const campusWiseRevenue = [...campusMap.entries()].map(([campusId, total]) => ({ campusId, total }));

  const [unpaidInvoices, paidInvoices, discounts, waivers, cashClosings, reconciliationExceptions] = await Promise.all([
    prisma.invoice.findMany({ where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } }, include: { items: true, allocations: true, waivers: { where: { status: "APPROVED" } } } }),
    prisma.invoice.count({ where: { status: "PAID", createdAt: { gte: filter.dateFrom, lte: filter.dateTo } } }),
    prisma.discount.findMany({ where: { status: "APPROVED", approvedAt: { gte: filter.dateFrom, lte: filter.dateTo } } }),
    prisma.waiver.findMany({ where: { status: "APPROVED", approvedAt: { gte: filter.dateFrom, lte: filter.dateTo } } }),
    prisma.cashClosing.findMany({
      where: { date: { gte: filter.dateFrom, lte: filter.dateTo }, ...(filter.campusId ? { campusId: filter.campusId } : {}) },
    }),
    prisma.reconciliationException.findMany({ where: { status: "PENDING" } }),
  ]);

  const outstandingFees = unpaidInvoices.reduce((sum, inv) => {
    const paid = inv.allocations.reduce((s, a) => s + Number(a.amount), 0);
    const waived = inv.waivers.reduce((s, w) => s + Number(w.amount), 0);
    const total = inv.items.reduce((s, i) => s + Number(i.amount), 0);
    return sum + Math.max(total - paid - waived, 0);
  }, 0);

  const discountWaiverSummary = {
    totalDiscounts: discounts.reduce((s, d) => s + Number(d.amount ?? 0), 0),
    discountCount: discounts.length,
    totalWaivers: waivers.reduce((s, w) => s + Number(w.amount), 0),
    waiverCount: waivers.length,
  };

  const cashierReports = cashClosings.map((c) => ({
    id: c.id,
    campusId: c.campusId,
    date: c.date,
    collections: Number(c.collections),
    variance: Number(c.variance),
    status: c.status,
  }));

  return {
    dailyCollection,
    monthlyCollection,
    outstandingFees: Math.round(outstandingFees * 100) / 100,
    paidInvoicesCount: paidInvoices,
    discountWaiverSummary,
    campusWiseRevenue,
    cashierReports,
    reconciliation: {
      pendingCount: reconciliationExceptions.length,
      pendingTotal: reconciliationExceptions.reduce((s, e) => s + Number(e.amount), 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Admission Reports
// ─────────────────────────────────────────────────────────────────────────

export async function getAdmissionReport(filter: { dateFrom: Date; dateTo: Date; campusId?: string; academicYearId?: string }) {
  const admissions = await prisma.admission.findMany({
    where: {
      appliedAt: { gte: filter.dateFrom, lte: filter.dateTo },
      campusId: filter.campusId,
      academicYearId: filter.academicYearId,
    },
  });

  const approvedRejected = {
    pending: admissions.filter((a) => a.status === "PENDING").length,
    approved: admissions.filter((a) => a.status === "APPROVED").length,
    rejected: admissions.filter((a) => a.status === "REJECTED").length,
    withdrawn: admissions.filter((a) => a.status === "WITHDRAWN").length,
  };

  const enrollments = await prisma.enrollment.findMany({
    where: {
      enrolledAt: { gte: filter.dateFrom, lte: filter.dateTo },
      academicYearId: filter.academicYearId,
      ...(filter.campusId ? { section: { campusId: filter.campusId } } : {}),
    },
  });
  const trendMap = new Map<string, number>();
  for (const e of enrollments) {
    const monthKey = e.enrolledAt.toISOString().slice(0, 7);
    trendMap.set(monthKey, (trendMap.get(monthKey) ?? 0) + 1);
  }
  const enrollmentTrends = [...trendMap.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));

  const sections = await prisma.section.findMany({
    where: { archivedAt: null, campusId: filter.campusId, academicYearId: filter.academicYearId },
    include: { class: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
  });
  const classCapacity = sections.map((s) => ({
    sectionId: s.id,
    sectionName: `${s.class.name} ${s.name}`,
    capacity: s.capacity,
    enrolled: s._count.enrollments,
    utilizationPercentage: s.capacity ? toPercentage(s._count.enrollments, s.capacity) : null,
  }));

  return {
    applicationsReceived: admissions.length,
    approvedRejected,
    enrollmentTrends,
    classCapacity,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Staff Reports
// ─────────────────────────────────────────────────────────────────────────

export async function getStaffReport(filter: { dateFrom: Date; dateTo: Date; campusId?: string }) {
  const teachers = await prisma.teacher.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { fullName: true } },
      assignments: { where: { archivedAt: null }, include: { section: true } },
    },
  });
  const relevantTeachers = filter.campusId
    ? teachers.filter((t) => t.assignments.some((a) => a.section.campusId === filter.campusId))
    : teachers;

  const teacherIds = relevantTeachers.map((t) => t.id);
  const [attendanceRows, leaves] = await Promise.all([
    teacherIds.length
      ? prisma.teacherAttendance.findMany({ where: { teacherId: { in: teacherIds }, date: { gte: filter.dateFrom, lte: filter.dateTo } } })
      : Promise.resolve([]),
    teacherIds.length
      ? prisma.leave.findMany({ where: { teacherId: { in: teacherIds }, status: "APPROVED", fromDate: { lte: filter.dateTo }, toDate: { gte: filter.dateFrom } } })
      : Promise.resolve([]),
  ]);

  const teacherWorkload = relevantTeachers.map((t) => ({
    teacherId: t.id,
    teacherName: t.user.fullName,
    sectionsAssigned: new Set(t.assignments.map((a) => a.sectionId)).size,
    subjectsTaught: new Set(t.assignments.map((a) => a.subjectId)).size,
  }));

  const attendanceByTeacher = new Map<string, { present: number; absent: number; leave: number }>();
  for (const row of attendanceRows) {
    const entry = attendanceByTeacher.get(row.teacherId) ?? { present: 0, absent: 0, leave: 0 };
    if (row.status === "PRESENT") entry.present += 1;
    else if (row.status === "ABSENT") entry.absent += 1;
    else entry.leave += 1;
    attendanceByTeacher.set(row.teacherId, entry);
  }
  const attendance = relevantTeachers.map((t) => {
    const v = attendanceByTeacher.get(t.id) ?? { present: 0, absent: 0, leave: 0 };
    const total = v.present + v.absent + v.leave;
    return { teacherId: t.id, teacherName: t.user.fullName, present: v.present, absent: v.absent, leave: v.leave, attendancePercentage: total > 0 ? toPercentage(v.present, total) : 0 };
  });

  const leaveCountByTeacher = new Map<string, number>();
  for (const l of leaves) {
    leaveCountByTeacher.set(l.teacherId!, (leaveCountByTeacher.get(l.teacherId!) ?? 0) + 1);
  }
  const leaveStatistics = relevantTeachers.map((t) => ({
    teacherId: t.id,
    teacherName: t.user.fullName,
    approvedLeaves: leaveCountByTeacher.get(t.id) ?? 0,
  }));

  return { teacherWorkload, attendance, leaveStatistics };
}

// ─────────────────────────────────────────────────────────────────────────
// CSV export — the one export format actually implemented this pass. PDF/
// Excel need a rendering dependency this project doesn't have yet; same
// category of deferral as Phase 4's report-card PDF stub (documented, not
// silently skipped).
// ─────────────────────────────────────────────────────────────────────────

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))];
  return lines.join("\n");
}
