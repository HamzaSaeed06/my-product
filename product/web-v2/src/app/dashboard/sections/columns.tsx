"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { Section } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { SectionRowActions } from "./row-actions";

function classNameOf(id: string) {
  return mockClasses.find((c) => c.id === id)?.name ?? id;
}
function campusNameOf(id: string) {
  return mockCampuses.find((c) => c.id === id)?.name ?? id;
}
function yearNameOf(id: string) {
  return mockAcademicYears.find((y) => y.id === id)?.name ?? id;
}

export const sectionColumns: ColumnDef<Section>[] = [
  {
    accessorKey: "name",
    header: "Section",
    meta: { label: "Section" },
    cell: ({ row }) => <span className="font-medium text-foreground">Section {row.original.name}</span>,
  },
  {
    id: "class",
    header: "Class",
    meta: { label: "Class" },
    accessorFn: (row) => classNameOf(row.classId),
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
    accessorKey: "capacity",
    header: "Capacity",
    meta: { label: "Capacity" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.capacity ?? "—"}</span>
    ),
  },
  {
    accessorKey: "archived",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.archived ? "neutral" : "success"}>
        {row.original.archived ? "Archived" : "Active"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <SectionRowActions section={row.original} />,
  },
];
