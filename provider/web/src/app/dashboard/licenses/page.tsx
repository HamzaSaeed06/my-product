import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GenerateLicenseDialog } from "./generate-dialog";
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

const STATE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  VALID: "default",
  EXPIRING_SOON: "secondary",
  EXPIRING_CRITICAL: "secondary",
  EXPIRED_GRACE: "destructive",
  EXPIRED_FINAL: "destructive",
  SUSPENDED: "secondary",
  REVOKED: "destructive",
};

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
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Deployment</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.licenseNumber}</TableCell>
                  <TableCell>{l.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.plan.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.deployment.url}</TableCell>
                  <TableCell>
                    <Badge variant={STATE_VARIANT[l.state] ?? "secondary"}>{l.state.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.expiresAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <LicenseStatusButtons licenseId={l.id} status={l.status} />
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
