"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users as UsersIcon,
  GraduationCap,
  School,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Viewer } from "@/lib/mock/session";

// Visibility is keyed off the SAME permission strings the backend route
// actually enforces — never a role name. This is the one thing the old
// product/web frontend got right (see its dashboard-sidebar.tsx); the
// implementation here is new, the principle is carried forward deliberately.
// Phase A/B ships a partial nav (only the modules that have a built page);
// see PROGRESS.md for the full Section 6 inventory still to land.
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  anyOf?: string[];
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/students", label: "Students", icon: GraduationCap, anyOf: ["student.view"] },
      { href: "/dashboard/users", label: "Users", icon: UsersIcon, anyOf: ["user.view"] },
    ],
  },
  {
    label: "Institute & Structure",
    items: [{ href: "/dashboard/campuses", label: "Campuses", icon: School, anyOf: ["campus.view"] }],
  },
];

export function AppSidebar({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const has = (key: string) => viewer.permissions.includes(key);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.anyOf || item.anyOf.some(has)),
  })).filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            R
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Rise Campus
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label || "root"}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-3 py-3 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
        Phase B build — see PROGRESS.md
      </SidebarFooter>
    </Sidebar>
  );
}
