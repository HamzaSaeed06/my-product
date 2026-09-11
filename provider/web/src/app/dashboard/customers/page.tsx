import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateCustomerDialog } from "./create-dialog";
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

export default async function CustomersPage() {
  const customers = await apiRequest<Customer[]>("/api/v1/customers");

  return (
    <div>
      <PageHeader title="Customers" description="Institutes this platform manages licenses and deployments for." action={<CreateCustomerDialog />} />

      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.customerCode}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/customers/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.contactName} · {c.contactEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CustomerStatusToggle customerId={c.id} status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
