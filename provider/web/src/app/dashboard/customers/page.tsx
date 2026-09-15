import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { CreateCustomerDialog } from "./create-dialog";
import { CustomersTable } from "./customers-table";

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
        <CustomersTable customers={customers} />
      )}
    </div>
  );
}
