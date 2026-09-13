"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { InchargeScope } from "@/lib/mock/incharge-scopes";
import { mockStaffUsers } from "@/lib/mock/users";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { mockClasses } from "@/lib/mock/classes";
import { ScopeRowActions } from "./row-actions";

function userNameOf(id: string) {
  return mockStaffUsers.find((u) => u.id === id)?.fullName ?? id;
}
function campusNameOf(id: string) {
  return mockCampuses.find((c) => c.id === id)?.name ?? id;
}
function yearNameOf(id: string) {
  return mockAcademicYears.find((y) => y.id === id)?.name ?? id;
}

export const scopeColumns: ColumnDef<InchargeScope>[] = [
  {
    id: "user",
    header: "Incharge",
    meta: { label: "Incharge" },
    accessorFn: (row) => userNameOf(row.userId),
    cell: ({ row }) => <span className="font-medium text-foreground">{userNameOf(row.original.userId)}</span>,
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => campusNameOf(row.campusId),
  },
  {
    id: "academicYear",
    header: "Academic year",
    meta: { label: "Academic year" },
    accessorFn: (row) => yearNameOf(row.academicYearId),
  },
  {
    id: "classes",
    header: "Classes",
    meta: { label: "Classes" },
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.classIds.map((id) => mockClasses.find((c) => c.id === id)?.name ?? id).join(", ")}
      </span>
    ),
  },
  {
    id: "sections",
    header: "Sections",
    meta: { label: "Sections" },
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.sectionIds.length === 0 ? "All sections" : `${row.original.sectionIds.length} selected`}
      </span>
    ),
  },
  {
    accessorKey: "revoked",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.revoked ? "neutral" : "success"}>
        {row.original.revoked ? "Revoked" : "Active"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <ScopeRowActions scope={row.original} />,
  },
];
