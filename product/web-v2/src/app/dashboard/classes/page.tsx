"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockClasses } from "@/lib/mock/classes";
import { classColumns } from "./columns";
import { ClassSheet } from "./class-sheet";

export default function ClassesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Classes"
        description="Institute-wide class catalog — campus-agnostic until a Section is opened for it."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New class
          </Button>
        }
      />
      <DataTable
        columns={classColumns}
        data={mockClasses}
        emptyTitle="No classes yet"
        emptyDescription="Add the institute's first class to the catalog."
      />
      <ClassSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
