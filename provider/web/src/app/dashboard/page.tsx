import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

interface DashboardSummary {
  customers: { total: number; active: number };
  licenses: { total: number; active: number; expiringSoon: number; expiredGrace: number; expiredFinal: number };
  deploymentHealth: { status: string; count: number }[];
  support: { open: number; byStatus: { status: string; count: number }[] };
}

export default async function DashboardPage() {
  const summary = await apiRequest<DashboardSummary>("/api/v1/dashboard");

  return (
    <div>
      <PageHeader title="Dashboard" description="Customers, licenses, deployment health, and support at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Total customers</p>
          <p className="text-2xl font-semibold text-foreground">{summary.customers.total}</p>
          <p className="text-xs text-muted-foreground">{summary.customers.active} active</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Active licenses</p>
          <p className="text-2xl font-semibold text-foreground">{summary.licenses.active}</p>
          <p className="text-xs text-muted-foreground">{summary.licenses.total} total</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Expiring soon</p>
          <p className="text-2xl font-semibold text-foreground">{summary.licenses.expiringSoon}</p>
          <p className="text-xs text-muted-foreground">within 30 days</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Open support tickets</p>
          <p className="text-2xl font-semibold text-foreground">{summary.support.open}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium text-foreground">Deployment health</p>
          {summary.deploymentHealth.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deployments yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.deploymentHealth.map((d) => (
                <Badge key={d.status} variant={d.status === "HEALTHY" ? "default" : d.status === "DOWN" ? "destructive" : "secondary"}>
                  {d.status} · {d.count}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium text-foreground">License expiry</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Expiring soon {summary.licenses.expiringSoon}</Badge>
            <Badge variant="secondary">In grace period {summary.licenses.expiredGrace}</Badge>
            <Badge variant="destructive">Expired {summary.licenses.expiredFinal}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
