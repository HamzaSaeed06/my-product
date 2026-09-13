"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { Delegation } from "@/lib/mock/delegations";
import { mockStaffUsers } from "@/lib/mock/users";
import { mockCampuses } from "@/lib/mock/campuses";
import { DelegationRowActions } from "./row-actions";

function userNameOf(id: string) {
  return mockStaffUsers.find((u) => u.id === id)?.fullName ?? id;
}

const ROLE_LABEL: Record<Delegation["role"], string> = {
  CAMPUS_HEAD: "Campus Head",
  INCHARGE: "Incharge",
  OFFICE: "Office",
};

export const delegationColumns: ColumnDef<Delegation>[] = [
  {
    id: "delegateTo",
    header: "Delegate",
    meta: { label: "Delegate" },
    accessorFn: (row) => userNameOf(row.delegateToUserId),
    cell: ({ row }) => <span className="font-medium text-foreground">{userNameOf(row.original.delegateToUserId)}</span>,
  },
  {
    id: "role",
    header: "Role granted",
    meta: { label: "Role granted" },
    cell: ({ row }) => ROLE_LABEL[row.original.role],
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId,
  },
  {
    id: "validity",
    header: "Valid",
    meta: { label: "Valid" },
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.validFrom} → {row.original.validUntil}
      </span>
    ),
  },
  {
    id: "grantedBy",
    header: "Granted by",
    meta: { label: "Granted by" },
    accessorFn: (row) => userNameOf(row.grantedByUserId),
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
    cell: ({ row }) => <DelegationRowActions delegation={row.original} />,
  },
];
