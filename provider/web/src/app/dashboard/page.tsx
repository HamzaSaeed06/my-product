import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";

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
        <StatCard label="Total customers" value={summary.customers.total} sublabel={`${summary.customers.active} active`} />
        <StatCard label="Active licenses" value={summary.licenses.active} sublabel={`${summary.licenses.total} total`} />
        <StatCard label="Expiring soon" value={summary.licenses.expiringSoon} sublabel="within 30 days" />
        <StatCard label="Open support tickets" value={summary.support.open} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deployment health</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">License expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Expiring soon {summary.licenses.expiringSoon}</Badge>
              <Badge variant="secondary">In grace period {summary.licenses.expiredGrace}</Badge>
              <Badge variant="destructive">Expired {summary.licenses.expiredFinal}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
