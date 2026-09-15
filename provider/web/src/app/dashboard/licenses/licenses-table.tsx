"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { LicenseStatusButtons } from "./status-buttons";

interface License {
  id: string;
  licenseNumber: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  state: string;
  issuedAt: string;
  expiresAt: string;
  customer: { id: string; name: string };
  plan: { name: string };
  deployment: { url: string };
}

const STATE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  VALID: "default",
  EXPIRING_SOON: "secondary",
  EXPIRING_CRITICAL: "secondary",
  EXPIRED_GRACE: "destructive",
  EXPIRED_FINAL: "destructive",
  SUSPENDED: "secondary",
  REVOKED: "destructive",
};

export function LicensesTable({ licenses }: { licenses: License[] }) {
  const columns: DataTableColumn<License>[] = [
    {
      key: "licenseNumber",
      header: "License #",
      sortValue: (l) => l.licenseNumber,
      render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.licenseNumber}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (l) => l.customer.name,
      render: (l) => l.customer.name,
    },
    {
      key: "plan",
      header: "Plan",
      sortValue: (l) => l.plan.name,
      render: (l) => <span className="text-muted-foreground">{l.plan.name}</span>,
    },
    {
      key: "deployment",
      header: "Deployment",
      render: (l) => <span className="text-muted-foreground">{l.deployment.url}</span>,
    },
    {
      key: "state",
      header: "State",
      sortValue: (l) => l.state,
      render: (l) => <Badge variant={STATE_VARIANT[l.state] ?? "secondary"}>{l.state.replace("_", " ")}</Badge>,
    },
    {
      key: "expiresAt",
      header: "Expires",
      sortValue: (l) => l.expiresAt,
      render: (l) => <span className="text-muted-foreground">{l.expiresAt.slice(0, 10)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (l) => <LicenseStatusButtons licenseId={l.id} licenseNumber={l.licenseNumber} status={l.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={licenses}
      getRowKey={(l) => l.id}
      searchPlaceholder="Search licenses..."
      searchText={(l) => `${l.licenseNumber} ${l.customer.name} ${l.plan.name} ${l.deployment.url}`}
      emptyMessage="No licenses match your search."
    />
  );
}
