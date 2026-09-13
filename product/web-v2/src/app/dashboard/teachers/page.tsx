"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockTeachers } from "@/lib/mock/teachers";
import { teacherColumns } from "./columns";
import { TeacherSheet } from "./teacher-sheet";

export default function TeachersPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teachers"
        description="Academic profiles linked 1:1 to a user who already holds the Teacher role."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New teacher profile
          </Button>
        }
      />
      <DataTable
        columns={teacherColumns}
        data={mockTeachers}
        emptyTitle="No teacher profiles yet"
        emptyDescription="Grant the Teacher role to a user on the Users page, then create their profile here."
      />
      <TeacherSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
