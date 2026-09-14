"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_PERMISSIONS } from "@/lib/mock/session";
import { mockRolePermissions } from "@/lib/mock/role-permissions";
import type { RoleDef } from "@/lib/mock/roles";

function titleCase(word: string) {
  return word.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function groupPermissions(permissions: string[]) {
  const groups = new Map<string, string[]>();
  for (const permission of permissions) {
    const [resource] = permission.split(".");
    if (!groups.has(resource)) groups.set(resource, []);
    groups.get(resource)!.push(permission);
  }
  return Array.from(groups.entries());
}

// No existing UI to copy in the old frontend — this is a genuinely new
// interaction shape for this project: a grouped permission checklist for
// one role at a time, matching the real backend's own PUT .../permissions
// endpoint, which replaces one role's full permission set wholesale.
export function PermissionsForm({ role }: { role: RoleDef }) {
  const [granted, setGranted] = useState<Set<string>>(() => new Set(mockRolePermissions.filter((g) => g.roleId === role.id).map((g) => g.permission)));

  const groups = groupPermissions(ALL_PERMISSIONS);

  function toggle(permission: string) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${role.name} — permissions`}
        description="Saving replaces this role's entire permission set — it's never a partial add/remove."
        actions={
          <Button
            size="sm"
            onClick={() => toast.success(`${granted.size} permissions saved for ${role.name}.`)}
          >
            Save permissions
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groups.map(([resource, permissions]) => (
          <div key={resource} className="surface-ring flex flex-col gap-2 rounded-[var(--card-radius)] p-4">
            <span className="label-eyebrow text-muted-foreground">{titleCase(resource)}</span>
            <div className="flex flex-col gap-1.5">
              {permissions.map((permission) => {
                const action = permission.split(".").slice(1).join(".");
                return (
                  <label key={permission} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={granted.has(permission)} onCheckedChange={() => toggle(permission)} />
                    {titleCase(action)}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
