import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateDeploymentDialog } from "./create-dialog";
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
  const customerById = new Map(customers.map((c) => [c.id, c]));

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
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Last check-in</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{customerById.get(d.customerId)?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/deployments/${d.id}`} className="text-foreground hover:underline">
                      {d.url}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.version}</TableCell>
                  <TableCell>
                    <Badge variant={d.healthStatus === "HEALTHY" ? "default" : d.healthStatus === "DOWN" ? "destructive" : "secondary"}>
                      {d.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.lastCheckInAt ? new Date(d.lastCheckInAt).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeploymentStatusSelect deploymentId={d.id} status={d.status} />
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
