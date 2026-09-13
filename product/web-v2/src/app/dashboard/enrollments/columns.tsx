"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import type { Enrollment, EnrollmentStatus } from "@/lib/mock/enrollments";
import { mockStudents } from "@/lib/mock/students";
import { mockClasses } from "@/lib/mock/classes";
import { mockSections } from "@/lib/mock/sections";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { EnrollmentRowActions } from "./row-actions";

const STATUS_TONE: Record<EnrollmentStatus, StatusTone> = { ACTIVE: "success", TRANSFERRED: "neutral", WITHDRAWN: "danger" };

export const enrollmentColumns: ColumnDef<Enrollment>[] = [
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => mockStudents.find((s) => s.id === row.studentId)?.fullName ?? row.studentId,
    cell: ({ row }) => {
      const student = mockStudents.find((s) => s.id === row.original.studentId);
      return student ? (
        <Link href={`/dashboard/students/${student.id}`} className="font-medium text-foreground hover:underline">
          {student.fullName}
        </Link>
      ) : (
        row.original.studentId
      );
    },
  },
  {
    id: "class",
    header: "Class / Section",
    meta: { label: "Class / Section" },
    cell: ({ row }) => {
      const section = mockSections.find((s) => s.id === row.original.sectionId);
      const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
      return `${className} ${section?.name ?? ""}`;
    },
  },
  {
    id: "academicYear",
    header: "Academic year",
    meta: { label: "Academic year" },
    accessorFn: (row) => mockAcademicYears.find((y) => y.id === row.academicYearId)?.name ?? row.academicYearId,
  },
  {
    accessorKey: "rollNumber",
    header: "Roll no.",
    meta: { label: "Roll no." },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.rollNumber ?? "—"}</span>,
  },
  {
    accessorKey: "enrolledAt",
    header: "Enrolled",
    meta: { label: "Enrolled" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.enrolledAt}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={STATUS_TONE[row.original.status]}>
        {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <EnrollmentRowActions enrollment={row.original} />,
  },
];
