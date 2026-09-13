"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockAdmissionInquiries } from "@/lib/mock/admission-inquiries";
import { inquiryColumns } from "./columns";
import { InquirySheet } from "./inquiry-sheet";

export default function AdmissionInquiriesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admission Inquiries"
        description="Leads before a formal application — convert one once the family is ready to apply."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Log inquiry
          </Button>
        }
      />
      <DataTable
        columns={inquiryColumns}
        data={mockAdmissionInquiries}
        emptyTitle="No inquiries yet"
        emptyDescription="Log a family's inquiry to start tracking it."
      />
      <InquirySheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
