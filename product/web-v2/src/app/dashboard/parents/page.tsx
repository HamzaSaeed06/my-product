"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockParents } from "@/lib/mock/parents";
import { parentColumns } from "./columns";
import { ParentSheet } from "./parent-sheet";

export default function ParentsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parents"
        description="Guardians and the students they're linked to — a student can have more than one guardian."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New parent
          </Button>
        }
      />
      <DataTable
        columns={parentColumns}
        data={mockParents}
        emptyTitle="No parents yet"
        emptyDescription="Add the institute's first parent, then link their children."
      />
      <ParentSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
