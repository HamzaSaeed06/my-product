"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mockParents } from "@/lib/mock/parents";
import { ParentCard } from "./parent-card";
import { CreateParentSheet } from "./create-parent-sheet";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockParents.map((parent) => (
          <ParentCard key={parent.id} parent={parent} />
        ))}
      </div>
      <CreateParentSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
