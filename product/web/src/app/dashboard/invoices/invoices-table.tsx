"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { VoidInvoiceDialog } from "./void-dialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  totalAmount: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
}

const STATUS_VARIANT: Record<Invoice["status"], "default" | "secondary"> = {
  UNPAID: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  VOID: "secondary",
};

// Client wrapper for the same Server/Client boundary reason as
// campuses-table.tsx — the page fetches, this owns the column defs
// (render/sortValue closures aren't serializable as props). Invoices is
// exactly the "can grow past a screenful" dataset DataTable exists for
// (see DESIGN.md), previously a bare unsorted/unsearchable Table.
export function InvoicesTable({
  invoices,
  studentNameById,
  canVoid,
}: {
  invoices: Invoice[];
  studentNameById: Record<string, string>;
  canVoid: boolean;
}) {
  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortValue: (inv) => inv.invoiceNumber,
      render: (inv) => (
        <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono text-xs text-muted-foreground hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    {
      key: "student",
      header: "Student",
      sortValue: (inv) => studentNameById[inv.studentId] ?? "",
      render: (inv) => <span className="font-medium text-foreground">{studentNameById[inv.studentId] ?? "—"}</span>,
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "right",
      sortValue: (inv) => Number(inv.totalAmount),
      render: (inv) => <span className="tabular-nums text-muted-foreground">{inv.totalAmount}</span>,
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortValue: (inv) => inv.dueDate,
      render: (inv) => <span className="text-muted-foreground">{inv.dueDate.slice(0, 10)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (inv) => inv.status,
      render: (inv) => <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>,
    },
  ];

  if (canVoid) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      render: (inv) => (inv.status === "UNPAID" ? <VoidInvoiceDialog invoiceId={inv.id} /> : null),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={invoices}
      getRowKey={(inv) => inv.id}
      searchPlaceholder="Search invoices..."
      searchText={(inv) => `${inv.invoiceNumber} ${studentNameById[inv.studentId] ?? ""}`}
      emptyMessage="No invoices match your search."
      pageSize={15}
    />
  );
}
