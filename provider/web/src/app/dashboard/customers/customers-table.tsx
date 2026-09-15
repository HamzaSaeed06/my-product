"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { CustomerStatusToggle } from "./status-toggle";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  contactName: string;
  contactEmail: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

// Client wrapper for the Server/Client boundary — the page fetches, this
// owns the column defs (render/sortValue closures aren't serializable as
// props to a Client Component).
export function CustomersTable({ customers }: { customers: Customer[] }) {
  const columns: DataTableColumn<Customer>[] = [
    {
      key: "customerCode",
      header: "Code",
      sortValue: (c) => c.customerCode,
      render: (c) => <span className="font-mono text-xs text-muted-foreground">{c.customerCode}</span>,
    },
    {
      key: "name",
      header: "Name",
      sortValue: (c) => c.name,
      render: (c) => (
        <Link href={`/dashboard/customers/${c.id}`} className="font-medium text-foreground hover:underline">
          {c.name}
        </Link>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <span className="text-muted-foreground">
          {c.contactName} · {c.contactEmail}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (c) => c.status,
      render: (c) => <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => <CustomerStatusToggle customerId={c.id} customerName={c.name} status={c.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={customers}
      getRowKey={(c) => c.id}
      searchPlaceholder="Search customers..."
      searchText={(c) => `${c.name} ${c.customerCode} ${c.contactName} ${c.contactEmail}`}
      emptyMessage="No customers match your search."
    />
  );
}
