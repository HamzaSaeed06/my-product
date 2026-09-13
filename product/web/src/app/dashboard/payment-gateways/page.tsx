import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateGatewayDialog } from "./create-dialog";
import { GatewayActiveToggle } from "./active-toggle";

interface Gateway {
  id: string;
  provider: "EASYPAISA" | "JAZZCASH" | "SIMULATED";
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default async function PaymentGatewaysPage() {
  // payment_gateway.manage gates list/create/edit alike (see routes.ts) —
  // the list route itself requires it, so a non-manager 403s the whole
  // page today; that's expected. Gate the write actions on the same key
  // as defense-in-depth/consistency with the rest of the app's convention.
  const canManage = ((await getCurrentUser())?.permissions ?? []).includes("payment_gateway.manage");
  const gateways = await apiRequest<Gateway[]>("/api/v1/payment-gateways");

  return (
    <div>
      <PageHeader
        title="Payment Gateways"
        description="Configure the gateway(s) used for parents' online payments. If more than one is active, the oldest active one is used."
        action={canManage ? <CreateGatewayDialog /> : undefined}
      />

      {gateways.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment gateways configured yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">{g.provider}</TableCell>
                  <TableCell>
                    <Badge variant={g.isActive ? "default" : "secondary"}>{g.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? <GatewayActiveToggle gatewayId={g.id} isActive={g.isActive} /> : null}
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
