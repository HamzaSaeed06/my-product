// Disposable, idempotent portal demo data — creates a coherent
// Teacher/Parent/Student scenario so the /portal shell can be verified live
// per role. Delete after use. Safe to re-run.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();
const PASSWORD = "Verify123!Pass";

async function upsertUserWithRole(email: string, fullName: string, roleSystemKey: string, campusId: string | null) {
  const role = await prisma.role.findFirstOrThrow({ where: { systemKey: roleSystemKey } });
  const passwordHash = await hashPassword(PASSWORD);
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email, passwordHash, fullName, isActive: true } });
  else user = await prisma.user.update({ where: { id: user.id }, data: { passwordHash, isActive: true } });
  const existing = await prisma.userRole.findFirst({ where: { userId: user.id, roleId: role.id, campusId } });
  if (!existing) await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, campusId } });
  return user;
}

async function main() {
  const institute = await prisma.institute.findFirstOrThrow();

  const campus =
    (await prisma.campus.findFirst({ where: { name: "Main Campus", archivedAt: null } })) ??
    (await prisma.campus.create({ data: { name: "Main Campus", instituteId: institute.id } }));

  const year =
    (await prisma.academicYear.findFirst({ where: { instituteId: institute.id, name: "2026-27" } })) ??
    (await prisma.academicYear.create({
      data: { instituteId: institute.id, name: "2026-27", startDate: new Date("2026-08-01"), endDate: new Date("2027-07-31") },
    }));

  const klass =
    (await prisma.class.findFirst({ where: { instituteId: institute.id, name: "Grade 5" } })) ??
    (await prisma.class.create({ data: { instituteId: institute.id, name: "Grade 5" } }));

  const subject =
    (await prisma.subject.findFirst({ where: { instituteId: institute.id, code: "MATH5" } })) ??
    (await prisma.subject.create({ data: { instituteId: institute.id, name: "Mathematics", code: "MATH5" } }));

  const section =
    (await prisma.section.findFirst({ where: { classId: klass.id, campusId: campus.id, academicYearId: year.id, name: "A" } })) ??
    (await prisma.section.create({ data: { classId: klass.id, campusId: campus.id, academicYearId: year.id, name: "A" } }));

  // Teacher
  const teacherUser = await upsertUserWithRole("verify-teacher@myproduct.local", "Verify Teacher", "TEACHER", campus.id);
  const teacher =
    (await prisma.teacher.findUnique({ where: { userId: teacherUser.id } })) ??
    (await prisma.teacher.create({ data: { userId: teacherUser.id, employeeCode: "EMP-VT-1" } }));
  const existingAssignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId: teacher.id, subjectId: subject.id, sectionId: section.id, academicYearId: year.id },
  });
  if (!existingAssignment) {
    await prisma.teacherAssignment.create({
      data: { teacherId: teacher.id, subjectId: subject.id, classId: klass.id, sectionId: section.id, academicYearId: year.id },
    });
  }
  // Make the teacher the section's class teacher too (Class-Teacher responsibility).
  await prisma.section.update({ where: { id: section.id }, data: { classTeacherId: teacherUser.id } });

  // Student (+ login) enrolled in the section
  const studentUser = await upsertUserWithRole("verify-student@myproduct.local", "Verify Student", "STUDENT", campus.id);
  let student = await prisma.student.findFirst({ where: { studentCode: "STU-VERIFY-1" } });
  if (!student) {
    student = await prisma.student.create({ data: { studentCode: "STU-VERIFY-1", fullName: "Verify Student", userId: studentUser.id, status: "ACTIVE" } });
  } else {
    student = await prisma.student.update({ where: { id: student.id }, data: { userId: studentUser.id } });
  }
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: student.id, sectionId: section.id } });
  if (!enrollment) {
    await prisma.enrollment.create({
      data: { studentId: student.id, academicYearId: year.id, classId: klass.id, sectionId: section.id, status: "ACTIVE", rollNumber: "5A-01" },
    });
  }

  // Parent (+ login) linked to the student
  const parentUser = await upsertUserWithRole("verify-parent@myproduct.local", "Verify Parent", "PARENT", null);
  let parent = await prisma.parent.findFirst({ where: { userId: parentUser.id } });
  if (!parent) parent = await prisma.parent.create({ data: { fullName: "Verify Parent", phone: "555-0199", userId: parentUser.id } });
  const link = await prisma.studentParent.findFirst({ where: { studentId: student.id, parentId: parent.id } });
  if (!link) {
    await prisma.studentParent.create({ data: { studentId: student.id, parentId: parent.id, relationship: "Mother", isPrimary: true } });
  }

  // A published homework for the section
  const hw = await prisma.homework.findFirst({ where: { sectionId: section.id, title: "Chapter 3 — Fractions" } });
  if (!hw) {
    await prisma.homework.create({
      data: {
        subjectId: subject.id, sectionId: section.id, classId: klass.id, teacherId: teacher.id,
        title: "Chapter 3 — Fractions", description: "Exercises 3.1–3.4", dueDate: new Date("2026-09-25"), status: "PUBLISHED",
      },
    });
  }

  // An attendance record for the student today
  const today = new Date();
  const att = await prisma.attendance.findFirst({ where: { studentId: student.id } });
  if (!att) {
    await prisma.attendance.create({
      data: { studentId: student.id, sectionId: section.id, date: today, status: "PRESENT", markedById: teacherUser.id },
    });
  }

  // A simple invoice for the student
  const inv = await prisma.invoice.findFirst({ where: { studentId: student.id, invoiceNumber: "INV-VERIFY-1" } });
  if (!inv) {
    await prisma.invoice.create({
      data: { invoiceNumber: "INV-VERIFY-1", studentId: student.id, campusId: campus.id, totalAmount: 5000, dueDate: new Date("2026-09-30"), status: "UNPAID" },
    });
  }

  console.log("Portal demo seeded:");
  console.log("  teacher:", teacherUser.email);
  console.log("  parent :", parentUser.email);
  console.log("  student:", studentUser.email);
  console.log("  password:", PASSWORD);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
