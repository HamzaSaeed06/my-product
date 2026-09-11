import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateCampusDialog, EditCampusDialog } from "./campus-dialogs";
import { ArchiveCampusButton } from "./archive-campus-button";

interface Campus {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  archivedAt: string | null;
}

export default async function CampusesPage() {
  const campuses = await apiRequest<Campus[]>("/api/v1/campuses");

  return (
    <div>
      <PageHeader
        title="Campuses"
        description="Branches/campuses under this institute."
        action={<CreateCampusDialog />}
      />

      {campuses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campuses yet. Click "Add campus" to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell className="font-medium">{campus.name}</TableCell>
                  <TableCell className="text-muted-foreground">{campus.address ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{campus.phone ?? "—"}</TableCell>
                  <TableCell>
                    {campus.archivedAt ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge>Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {!campus.archivedAt && (
                      <>
                        <EditCampusDialog campus={campus} />
                        <ArchiveCampusButton id={campus.id} name={campus.name} />
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
