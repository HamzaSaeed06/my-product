"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Combobox } from "@/components/combobox";
import { DataTable } from "@/components/data-table";
import { mockAuditLog } from "@/lib/mock/audit-log";
import { mockAppUsers } from "@/lib/mock/app-users";
import { auditLogColumns } from "./columns";

const ACTOR_OPTIONS = mockAppUsers.map((u) => ({ value: u.id, label: u.fullName }));
const RESOURCE_OPTIONS = Array.from(new Set(mockAuditLog.map((e) => e.resource))).map((r) => ({ value: r, label: r }));

export default function AuditLogPage() {
  const [actorId, setActorId] = useState<string | null>(null);
  const [resource, setResource] = useState<string | null>(null);

  const filtered = mockAuditLog.filter((e) => (!actorId || e.actorId === actorId) && (!resource || e.resource === resource));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit Log" description="Immutable by design — every entry here is a permanent record, there's no edit or delete route for this at all." />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Actor</span>
        <Combobox options={ACTOR_OPTIONS} value={actorId} onChange={setActorId} placeholder="Anyone" className="w-52" />
        <span className="ml-2 text-sm text-muted-foreground">Resource</span>
        <Combobox options={RESOURCE_OPTIONS} value={resource} onChange={setResource} placeholder="Any" className="w-44" />
      </div>

      <DataTable columns={auditLogColumns} data={filtered} emptyTitle="No matching entries" emptyDescription="Try a different actor or resource." />
    </div>
  );
}
