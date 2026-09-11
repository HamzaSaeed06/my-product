import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateCategoryDialog } from "./category-dialog";
import { CreateStructureDialog } from "./structure-dialog";
import { ArchiveCategoryButton, ArchiveStructureButton } from "./archive-buttons";

interface Institute {
  id: string;
}

interface NamedOption {
  id: string;
  name: string;
}

interface FeeCategory {
  id: string;
  name: string;
  archivedAt: string | null;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  klass: { name: string };
  feeCategory: { name: string };
}

export default async function FeeStructuresPage() {
  const [institute, classes, categories, structures] = await Promise.all([
    apiRequest<Institute>("/api/v1/institute"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<FeeCategory[]>("/api/v1/fee-categories"),
    apiRequest<FeeStructure[]>("/api/v1/fee-structures"),
  ]);

  return (
    <div>
      <PageHeader title="Fee Structures" description="Define fee categories, then a fee structure per class." />

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Fee Categories</h2>
          <CreateCategoryDialog instituteId={institute.id} />
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee categories yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                {c.name}
                <ArchiveCategoryButton id={c.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Fee Structures</h2>
          <CreateStructureDialog instituteId={institute.id} classes={classes} categories={categories} />
        </div>
        {structures.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee structures yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.klass.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.feeCategory.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.frequency}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ArchiveStructureButton id={s.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
