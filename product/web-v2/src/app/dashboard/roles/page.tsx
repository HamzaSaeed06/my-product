"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockRoles } from "@/lib/mock/roles";
import { roleColumns } from "./columns";
import { CreateRoleSheet } from "./create-sheet";

export default function RolesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        description="The 7 built-in roles plus any custom ones. Open a role to edit exactly which permissions it grants."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Create role
          </Button>
        }
      />
      <DataTable columns={roleColumns} data={mockRoles} emptyTitle="No roles" emptyDescription="Create a custom role to get started." />
      <CreateRoleSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
