import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { CreateDeploymentDialog } from "./create-dialog";
import { DeploymentsTable } from "./deployments-table";

interface Deployment {
  id: string;
  customerId: string;
  version: string;
  url: string;
  status: string;
  healthStatus: string;
  lastCheckInAt: string | null;
}

interface Customer {
  id: string;
  name: string;
  customerCode: string;
}

export default async function DeploymentsPage() {
  const [deployments, customers] = await Promise.all([
    apiRequest<Deployment[]>("/api/v1/deployments"),
    apiRequest<Customer[]>("/api/v1/customers"),
  ]);
  const customerNameById = Object.fromEntries(customers.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Deployments"
        description="Registry and health status only — no remote restart/update actions."
        action={<CreateDeploymentDialog customers={customers} />}
      />

      {deployments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deployments yet.</p>
      ) : (
        <DeploymentsTable deployments={deployments} customerNameById={customerNameById} />
      )}
    </div>
  );
}
