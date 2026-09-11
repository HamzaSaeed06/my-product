import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateDiscountDialog } from "./create-dialog";
import { DecideDiscountButtons } from "./decide-buttons";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
  status: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
}

interface Discount {
  id: string;
  studentId: string;
  type: string;
  amount: string | null;
  percentage: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default async function DiscountsPage() {
  const [discounts, students] = await Promise.all([
    apiRequest<Discount[]>("/api/v1/discounts"),
    apiRequest<Student[]>("/api/v1/students"),
  ]);

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const studentById = new Map(students.map((s) => [s.id, s]));

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Sibling, merit, or staff discounts — reason required, approval required."
        action={<CreateDiscountDialog students={activeStudents} />}
      />

      {discounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No discounts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{studentById.get(d.studentId)?.fullName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.type}</TableCell>
                  <TableCell className="text-muted-foreground">{d.percentage ? `${d.percentage}%` : d.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{d.reason}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "APPROVED" ? "default" : "secondary"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{d.status === "PENDING" ? <DecideDiscountButtons id={d.id} /> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
