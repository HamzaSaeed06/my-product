"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockComplaints } from "@/lib/mock/complaints";
import { complaintColumns } from "./columns";
import { CreateComplaintDialog } from "./create-dialog";

export default function ComplaintsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Complaints"
        description="A ticket workflow — Open → Assigned → In progress → Resolved → Closed, with reopen and forward along the way."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Log complaint
          </Button>
        }
      />
      <DataTable columns={complaintColumns} data={mockComplaints} emptyTitle="No complaints logged" emptyDescription="Log one to start tracking it." />
      <CreateComplaintDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
