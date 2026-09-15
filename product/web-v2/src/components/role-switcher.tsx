"use client";

import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_COOKIE_NAME, ROLE_COOKIE_MAX_AGE } from "@/lib/role-cookie";
import { DASHBOARD_ROLES } from "@/lib/mock/role-switch";

// Phase A/B review tool, same spirit as ThemeSwitcher: lets whoever is
// reviewing the build see exactly what each role's sidebar/permissions
// look like without a real per-role login. Writes the same roleId the
// server layout reads back out of the cookie to compute the active
// Viewer — not part of the shipped product surface.
export function RoleSwitcher({ activeRoleId }: { activeRoleId: string }) {
  const router = useRouter();

  return (
    <Select
      value={activeRoleId}
      onValueChange={(roleId) => {
        if (!roleId) return;
        document.cookie = `${ROLE_COOKIE_NAME}=${roleId}; path=/; max-age=${ROLE_COOKIE_MAX_AGE}`;
        // Land back on Overview (the one nav item with no permission gate)
        // rather than leaving the viewer stranded on a page the new role
        // can't see in its own sidebar.
        router.push("/dashboard");
        router.refresh();
      }}
    >
      <SelectTrigger className="w-44 gap-1.5" size="sm" aria-label="Preview as role">
        <UserCog className="size-3.5 text-muted-foreground" />
        <SelectValue>{(v: string) => DASHBOARD_ROLES.find((r) => r.id === v)?.name ?? v}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {DASHBOARD_ROLES.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
