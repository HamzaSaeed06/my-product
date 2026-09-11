import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateClassDialog, EditClassDialog } from "./class-dialogs";
import { ArchiveClassButton } from "./archive-class-button";

interface Klass {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
}

export default async function ClassesPage() {
  const classes = await apiRequest<Klass[]>("/api/v1/classes");

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Institute-wide class catalog (e.g. Montessori, Class 5) — names are fully configurable."
        action={<CreateClassDialog />}
      />

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No classes yet. Click "Add class" to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sort order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((klass) => (
                <TableRow key={klass.id}>
                  <TableCell className="font-medium">{klass.name}</TableCell>
                  <TableCell className="text-muted-foreground">{klass.sortOrder}</TableCell>
                  <TableCell>
                    {klass.archivedAt ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {!klass.archivedAt && (
                      <>
                        <EditClassDialog klass={klass} />
                        <ArchiveClassButton id={klass.id} name={klass.name} />
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
