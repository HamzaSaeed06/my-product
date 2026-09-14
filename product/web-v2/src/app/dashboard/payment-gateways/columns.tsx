"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import type { GatewayProvider, PaymentGateway } from "@/lib/mock/payment-gateways";

const PROVIDER_LABEL: Record<GatewayProvider, string> = { EASYPAISA: "Easypaisa", JAZZCASH: "JazzCash", SIMULATED: "Simulated" };

export function getGatewayColumns(onToggle: (id: string) => void): ColumnDef<PaymentGateway>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { label: "Name" },
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "provider",
      header: "Provider",
      meta: { label: "Provider" },
      cell: ({ row }) => PROVIDER_LABEL[row.original.provider],
    },
    {
      id: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => <StatusDot tone={row.original.isActive ? "success" : "neutral"}>{row.original.isActive ? "Active" : "Inactive"}</StatusDot>,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => onToggle(row.original.id)}>
          {row.original.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];
}
