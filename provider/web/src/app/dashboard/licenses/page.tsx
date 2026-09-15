import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { GenerateLicenseDialog } from "./generate-dialog";
import { LicensesTable } from "./licenses-table";

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

interface Customer {
  id: string;
  name: string;
  customerCode: string;
}
interface Plan {
  id: string;
  name: string;
}
interface Deployment {
  id: string;
  customerId: string;
  url: string;
}

export default async function LicensesPage() {
  const [licenses, customers, plans, deployments] = await Promise.all([
    apiRequest<License[]>("/api/v1/licenses"),
    apiRequest<Customer[]>("/api/v1/customers"),
    apiRequest<Plan[]>("/api/v1/plans"),
    apiRequest<Deployment[]>("/api/v1/deployments"),
  ]);

  return (
    <div>
      <PageHeader
        title="Licenses"
        description="Generate new, view active/expiring/suspended, or revoke."
        action={<GenerateLicenseDialog customers={customers} plans={plans} deployments={deployments} />}
      />

      {licenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No licenses issued yet.</p>
      ) : (
        <LicensesTable licenses={licenses} />
      )}
    </div>
  );
}
