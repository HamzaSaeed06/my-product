"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockEnrollments } from "@/lib/mock/enrollments";
import { enrollmentColumns } from "./columns";
import { EnrollSheet } from "./enroll-sheet";

export default function EnrollmentsPage() {
  const [enrollOpen, setEnrollOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enrollments"
        description="Which section and academic year each student is actually placed into — separate from admission."
        actions={
          <Button size="sm" onClick={() => setEnrollOpen(true)}>
            <Plus className="size-3.5" />
            Enroll student
          </Button>
        }
      />
      <DataTable
        columns={enrollmentColumns}
        data={mockEnrollments}
        emptyTitle="No enrollments yet"
        emptyDescription="Enroll an admitted student into a section to get started."
      />
      <EnrollSheet open={enrollOpen} onOpenChange={setEnrollOpen} />
    </div>
  );
}
