import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateSubjectDialog, EditSubjectDialog } from "./subject-dialogs";
import { ArchiveSubjectButton } from "./archive-subject-button";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  archivedAt: string | null;
}

export default async function SubjectsPage() {
  const subjects = await apiRequest<Subject[]>("/api/v1/subjects");

  return (
    <div>
      <PageHeader title="Subjects" description="Institute-wide subject catalog." action={<CreateSubjectDialog />} />

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subjects yet. Click "Add subject" to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">{subject.code ?? "—"}</TableCell>
                  <TableCell>
                    {subject.archivedAt ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {!subject.archivedAt && (
                      <>
                        <EditSubjectDialog subject={subject} />
                        <ArchiveSubjectButton id={subject.id} name={subject.name} />
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
