"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import type { Admission, AdmissionStatus } from "@/lib/mock/admissions";
import { mockStudents } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { AdmissionRowActions } from "./row-actions";

const STATUS_TONE: Record<AdmissionStatus, StatusTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
};

export const admissionColumns: ColumnDef<Admission>[] = [
  {
    id: "student",
    header: "Applicant",
    meta: { label: "Applicant" },
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
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId,
  },
  {
    id: "class",
    header: "Class",
    meta: { label: "Class" },
    accessorFn: (row) => mockClasses.find((c) => c.id === row.classId)?.name ?? row.classId,
  },
  {
    id: "academicYear",
    header: "Academic year",
    meta: { label: "Academic year" },
    accessorFn: (row) => mockAcademicYears.find((y) => y.id === row.academicYearId)?.name ?? row.academicYearId,
  },
  {
    accessorKey: "appliedAt",
    header: "Applied",
    meta: { label: "Applied" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.appliedAt}</span>,
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
    cell: ({ row }) => <AdmissionRowActions admission={row.original} />,
  },
];
