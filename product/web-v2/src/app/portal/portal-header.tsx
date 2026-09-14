"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { mockParents } from "@/lib/mock/parents";
import { getStudentById } from "@/lib/mock/students";
import { PORTAL_DEMO, type PortalRole } from "@/lib/mock/portal-session";
import { usePortal } from "./portal-context";

const ROLE_LABEL: Record<PortalRole, string> = { TEACHER: "Teacher", PARENT: "Parent", STUDENT: "Student" };

// Same thin header as the dashboard's SiteHeader — the signed-in identity
// and Log out live in the sidebar footer (NavUser) now, not here. The
// persona switcher sits where CampusScopePicker sits on the dashboard: a
// review-time-only stand-in for a real session, not a shipped control.
export function PortalHeader() {
  const { role, setRole, activeChildId, setActiveChildId } = usePortal();
  const parent = mockParents.find((p) => p.id === PORTAL_DEMO.parentId);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <Select value={role} onValueChange={(v) => setRole(v as PortalRole)}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue>{(v) => ROLE_LABEL[v as PortalRole]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="PARENT">Parent</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
          </SelectContent>
        </Select>
        {role === "PARENT" && parent && parent.children.length > 1 && (
          <Select value={activeChildId} onValueChange={(v) => v && setActiveChildId(v)}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue>{(v) => getStudentById(v as string)?.fullName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {parent.children.map((c) => (
                <SelectItem key={c.studentId} value={c.studentId}>
                  {getStudentById(c.studentId)?.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
