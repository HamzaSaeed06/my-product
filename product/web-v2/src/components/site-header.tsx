"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CampusScopePicker } from "@/components/campus-scope-picker";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { RoleSwitcher } from "@/components/role-switcher";
import type { Viewer } from "@/lib/mock/session";

// The signed-in identity + Log out live in the sidebar footer now (see
// NavUser) — this header stays a thin context-control bar, matching the
// portal's own header exactly.
export function SiteHeader({ viewer, activeRoleId }: { viewer: Viewer; activeRoleId: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        {viewer.scope ? (
          <span className="text-sm text-muted-foreground">{viewer.scope.campusName}</span>
        ) : (
          <CampusScopePicker />
        )}
      </div>

      <div className="flex items-center gap-2">
        <RoleSwitcher activeRoleId={activeRoleId} />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
