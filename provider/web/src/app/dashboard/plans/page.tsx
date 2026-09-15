import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreatePlanDialog } from "./create-dialog";
import { PlanActiveToggle } from "./active-toggle";

interface Plan {
  id: string;
  name: string;
  tier: string;
  features: string[];
  maxStudents: number;
  maxCampuses: number;
  maxStaff: number;
  maxStorageMb: number;
  isActive: boolean;
}

export default async function PlansPage() {
  const plans = await apiRequest<Plan[]>("/api/v1/plans");

  return (
    <div>
      <PageHeader title="Plans" description="Subscription tiers used when generating a license." action={<CreatePlanDialog />} />

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plans yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.maxStudents} students · {p.maxCampuses} campuses · {p.maxStaff} staff · {p.maxStorageMb}MB
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.features.join(", ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PlanActiveToggle planId={p.id} planName={p.name} isActive={p.isActive} />
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
