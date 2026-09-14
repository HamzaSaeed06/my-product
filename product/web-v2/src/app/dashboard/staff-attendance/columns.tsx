"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockCampuses } from "@/lib/mock/campuses";
import type { CheckInMethod, StaffAttendanceRecord, VerifiedStatus } from "@/lib/mock/staff-attendance";

const METHOD_LABEL: Record<CheckInMethod, string> = { QR: "QR", MANUAL: "Manual", REMOTE_APPROVED: "Remote (approved)" };
const VERIFIED_TONE: Record<VerifiedStatus, StatusTone> = { VERIFIED: "success", UNVERIFIED: "warning", MANUAL_OVERRIDE: "neutral" };
const VERIFIED_LABEL: Record<VerifiedStatus, string> = { VERIFIED: "Verified", UNVERIFIED: "Unverified", MANUAL_OVERRIDE: "Manual override" };

export const staffAttendanceColumns: ColumnDef<StaffAttendanceRecord>[] = [
  {
    id: "user",
    header: "Staff member",
    meta: { label: "Staff member" },
    accessorFn: (row) => mockAppUsers.find((u) => u.id === row.userId)?.fullName ?? row.userId,
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId,
  },
  {
    accessorKey: "checkInAt",
    header: "Check-in",
    meta: { label: "Check-in" },
    cell: ({ row }) =>
      row.original.checkInAt ? (
        <span className="font-mono text-sm">{new Date(row.original.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Not checked in</span>
      ),
  },
  {
    accessorKey: "checkInMethod",
    header: "Method",
    meta: { label: "Method" },
    cell: ({ row }) => (row.original.checkInMethod ? METHOD_LABEL[row.original.checkInMethod] : "—"),
  },
  {
    accessorKey: "verifiedStatus",
    header: "Verification",
    meta: { label: "Verification" },
    cell: ({ row }) => <StatusDot tone={VERIFIED_TONE[row.original.verifiedStatus]}>{VERIFIED_LABEL[row.original.verifiedStatus]}</StatusDot>,
  },
];
