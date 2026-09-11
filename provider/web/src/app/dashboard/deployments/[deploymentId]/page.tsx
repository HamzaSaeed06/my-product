import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HealthCheck {
  id: string;
  receivedAt: string;
  version: string;
  uptimeSeconds: number;
  studentCount: number;
  staffCount: number;
  campusCount: number;
  apiStatus: string;
  dbStatus: string;
  avgResponseTimeMs: number;
  errorRatePercent: number;
}

interface DeploymentDetail {
  id: string;
  customerId: string;
  version: string;
  url: string;
  status: string;
  healthStatus: string;
  lastCheckInAt: string | null;
  healthChecks: HealthCheck[];
}

export default async function DeploymentDetailPage({ params }: { params: Promise<{ deploymentId: string }> }) {
  const { deploymentId } = await params;
  const deployment = await apiRequest<DeploymentDetail>(`/api/v1/deployments/${deploymentId}`);

  return (
    <div>
      <PageHeader
        title={deployment.url}
        description={`Version ${deployment.version} · ${deployment.status}`}
        action={
          <Badge variant={deployment.healthStatus === "HEALTHY" ? "default" : deployment.healthStatus === "DOWN" ? "destructive" : "secondary"}>
            {deployment.healthStatus}
          </Badge>
        }
      />

      <h2 className="mb-3 text-sm font-semibold text-foreground">Recent heartbeats</h2>
      {deployment.healthChecks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No heartbeats received yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Campuses</TableHead>
                <TableHead>API</TableHead>
                <TableHead>DB</TableHead>
                <TableHead>Avg response</TableHead>
                <TableHead>Error rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployment.healthChecks.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground">{new Date(h.receivedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{h.version}</TableCell>
                  <TableCell>{h.studentCount}</TableCell>
                  <TableCell>{h.staffCount}</TableCell>
                  <TableCell>{h.campusCount}</TableCell>
                  <TableCell>
                    <Badge variant={h.apiStatus === "healthy" ? "default" : "destructive"}>{h.apiStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={h.dbStatus === "healthy" ? "default" : "destructive"}>{h.dbStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{h.avgResponseTimeMs}ms</TableCell>
                  <TableCell className={h.errorRatePercent > 0 ? "text-destructive" : "text-muted-foreground"}>{h.errorRatePercent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
