import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateCategoryDialog } from "./category-dialog";
import { CreateStructureDialog } from "./structure-dialog";
import { FeeCategoriesList, FeeStructuresTable } from "./fee-structures-table";

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
  // Mirrors fee_structure.create/fee_structure.edit from routes.ts — the
  // archive endpoints for both categories and structures require
  // fee_structure.edit, not a separate archive key. `institute` and
  // `classes` are fetched only to feed the two create dialogs' hidden
  // instituteId input / class picker, so both are gated behind canCreate
  // (institute.view is a distinct permission a fee_structure viewer may
  // lack). `categories` is dual-purpose (also renders as the always-visible
  // category chip list), so it stays unconditional.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("fee_structure.create");
  const canEdit = permissions.includes("fee_structure.edit");

  const [institute, classes, categories, structures] = await Promise.all([
    canCreate ? apiRequest<Institute>("/api/v1/institute") : Promise.resolve<Institute | null>(null),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/classes") : Promise.resolve<NamedOption[]>([]),
    apiRequest<FeeCategory[]>("/api/v1/fee-categories"),
    apiRequest<FeeStructure[]>("/api/v1/fee-structures"),
  ]);

  return (
    <div>
      <PageHeader title="Fee Structures" description="Define fee categories, then a fee structure per class." />

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Fee Categories</h2>
          {canCreate && institute ? <CreateCategoryDialog instituteId={institute.id} /> : null}
        </div>
        <FeeCategoriesList categories={categories} canEdit={canEdit} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Fee Structures</h2>
          {canCreate && institute ? (
            <CreateStructureDialog instituteId={institute.id} classes={classes} categories={categories} />
          ) : null}
        </div>
        <FeeStructuresTable structures={structures} canEdit={canEdit} />
      </div>
    </div>
  );
}
