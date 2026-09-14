"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  CalendarCheck2,
  NotebookPen,
  CalendarOff,
  ListChecks,
  FileBadge2,
  Receipt,
  MessageSquareWarning,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { usePortal, usePortalIdentity } from "./portal-context";
import type { PortalRole } from "@/lib/mock/portal-session";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Same sidebar component, same nav-item shape as AppSidebar (dashboard) —
// the only real difference is that visibility here is keyed by portal
// role instead of a permission string, since the real backend gates the
// portal by raw role membership, not the granular permission system.
const NAV: Record<PortalRole, NavItem[]> = {
  TEACHER: [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/timetable", label: "Timetable", icon: CalendarClock },
    { href: "/portal/attendance", label: "Attendance", icon: CalendarCheck2 },
    { href: "/portal/homework", label: "Homework", icon: NotebookPen },
    { href: "/portal/leave", label: "Leave", icon: CalendarOff },
  ],
  PARENT: [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/attendance", label: "Attendance", icon: CalendarCheck2 },
    { href: "/portal/timetable", label: "Timetable", icon: CalendarClock },
    { href: "/portal/homework", label: "Homework", icon: NotebookPen },
    { href: "/portal/results", label: "Results", icon: ListChecks },
    { href: "/portal/report-card", label: "Report Card", icon: FileBadge2 },
    { href: "/portal/fees", label: "Fees", icon: Receipt },
    { href: "/portal/leave", label: "Leave", icon: CalendarOff },
    { href: "/portal/complaints", label: "Complaints", icon: MessageSquareWarning },
  ],
  STUDENT: [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/timetable", label: "Timetable", icon: CalendarClock },
    { href: "/portal/attendance", label: "Attendance", icon: CalendarCheck2 },
    { href: "/portal/homework", label: "Homework", icon: NotebookPen },
    { href: "/portal/results", label: "Results", icon: ListChecks },
    { href: "/portal/report-card", label: "Report Card", icon: FileBadge2 },
  ],
};

const ROLE_LABEL: Record<PortalRole, string> = { TEACHER: "Teacher", PARENT: "Parent", STUDENT: "Student" };

export function PortalSidebar() {
  const { role } = usePortal();
  const identity = usePortalIdentity();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const items = NAV[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3">
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
        <SidebarGroup>
          <SidebarGroupLabel className="label-eyebrow text-sidebar-foreground/60">{ROLE_LABEL[role]} Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      className="rounded-[var(--nav-radius)]"
                      render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={identity.name} subtitle={identity.subtitle} />
      </SidebarFooter>
    </Sidebar>
  );
}
