"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mockSections } from "@/lib/mock/sections";
import { SectionFilters } from "./section-filters";
import { SectionSheet } from "./section-sheet";

export default function SectionsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sections"
        description="The campus + academic-year instance of a class — this is what students enroll into."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New section
          </Button>
        }
      />
      <SectionFilters sections={mockSections} />
      <SectionSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
