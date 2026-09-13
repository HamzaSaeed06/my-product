"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockAppUsers } from "@/lib/mock/app-users";
import { userColumns } from "./columns";
import { CreateUserSheet } from "./create-user-sheet";

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Login identities. Access comes entirely from the roles granted below — a new user starts with none."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New user
          </Button>
        }
      />
      <DataTable
        columns={userColumns}
        data={mockAppUsers}
        emptyTitle="No users yet"
        emptyDescription="Create the institute's first user, then grant them a role."
      />
      <CreateUserSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
