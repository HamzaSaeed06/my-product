import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mockAdmissions } from "@/lib/mock/admissions";
import { AdmissionFilters } from "./admission-filters";

export default function AdmissionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admissions"
        description="Approving an admission does not create an enrollment — those are separate steps."
        actions={
          <Button size="sm" render={<Link href="/dashboard/admissions/new" />}>
            <Plus className="size-3.5" />
            New admission
          </Button>
        }
      />
      <AdmissionFilters admissions={mockAdmissions} />
    </div>
  );
}
