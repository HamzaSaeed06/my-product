"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockLeaves } from "@/lib/mock/leaves";
import { leaveColumns } from "./columns";
import { CreateLeaveDialog } from "./create-dialog";

export default function LeavesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leaves"
        description="Student and teacher leave requests. A student's request auto-routes to their section's Incharge to decide."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Request leave
          </Button>
        }
      />
      <DataTable columns={leaveColumns} data={mockLeaves} emptyTitle="No leave requests" emptyDescription="Request one for a student or teacher." />
      <CreateLeaveDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
