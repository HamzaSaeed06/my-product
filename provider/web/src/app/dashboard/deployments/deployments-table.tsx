"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DeploymentStatusSelect } from "./status-select";

interface Deployment {
  id: string;
  customerId: string;
  version: string;
  url: string;
  status: string;
  healthStatus: string;
  lastCheckInAt: string | null;
}

export function DeploymentsTable({
  deployments,
  customerNameById,
}: {
  deployments: Deployment[];
  customerNameById: Record<string, string>;
}) {
  const columns: DataTableColumn<Deployment>[] = [
    {
      key: "customer",
      header: "Customer",
      sortValue: (d) => customerNameById[d.customerId] ?? "",
      render: (d) => <span className="text-muted-foreground">{customerNameById[d.customerId] ?? "—"}</span>,
    },
    {
      key: "url",
      header: "URL",
      sortValue: (d) => d.url,
      render: (d) => (
        <Link href={`/dashboard/deployments/${d.id}`} className="text-foreground hover:underline">
          {d.url}
        </Link>
      ),
    },
    {
      key: "version",
      header: "Version",
      sortValue: (d) => d.version,
      render: (d) => <span className="text-muted-foreground">{d.version}</span>,
    },
    {
      key: "health",
      header: "Health",
      sortValue: (d) => d.healthStatus,
      render: (d) => (
        <Badge variant={d.healthStatus === "HEALTHY" ? "default" : d.healthStatus === "DOWN" ? "destructive" : "secondary"}>
          {d.healthStatus}
        </Badge>
      ),
    },
    {
      key: "lastCheckIn",
      header: "Last check-in",
      sortValue: (d) => d.lastCheckInAt ?? "",
      render: (d) => (
        <span className="text-muted-foreground">{d.lastCheckInAt ? new Date(d.lastCheckInAt).toLocaleString() : "Never"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (d) => <DeploymentStatusSelect deploymentId={d.id} url={d.url} status={d.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={deployments}
      getRowKey={(d) => d.id}
      searchPlaceholder="Search deployments..."
      searchText={(d) => `${d.url} ${customerNameById[d.customerId] ?? ""} ${d.version}`}
      emptyMessage="No deployments match your search."
    />
  );
}
