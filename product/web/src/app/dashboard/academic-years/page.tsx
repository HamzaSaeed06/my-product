import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateAcademicYearDialog, EditAcademicYearDialog } from "./academic-year-dialogs";
import { CloseYearButton } from "./close-year-button";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AcademicYearsPage() {
  const years = await apiRequest<AcademicYear[]>("/api/v1/academic-years");

  return (
    <div>
      <PageHeader
        title="Academic Years"
        description="Sessions can overlap — this is deliberate, not a bug."
        action={<CreateAcademicYearDialog />}
      />

      {years.length === 0 ? (
        <p className="text-sm text-muted-foreground">No academic years yet. Click "Add academic year" to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(year.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(year.endDate)}</TableCell>
                  <TableCell>
                    {year.status === "CLOSED" ? <Badge variant="secondary">Closed</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {year.status === "ACTIVE" && (
                      <>
                        <EditAcademicYearDialog year={year} />
                        <CloseYearButton id={year.id} name={year.name} />
                      </>
                    )}
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
