"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockCampuses } from "@/lib/mock/campuses";
import { campusColumns } from "./columns";
import { CampusSheet } from "./campus-sheet";

export default function CampusesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campuses"
        description="Click a campus to drill into its own sections, incharge scopes, and staff."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New campus
          </Button>
        }
      />
      <DataTable
        columns={campusColumns}
        data={mockCampuses}
        emptyTitle="No campuses yet"
        emptyDescription="Create the institute's first campus to start opening sections."
      />
      <CampusSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
