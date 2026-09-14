"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockParents } from "@/lib/mock/parents";
import { getStudentById } from "@/lib/mock/students";
import { cn } from "@/lib/utils";
import { usePortal } from "./portal-context";
import type { PortalRole } from "@/lib/mock/portal-session";
import { PORTAL_DEMO } from "@/lib/mock/portal-session";

const NAV: Record<PortalRole, { href: string; label: string }[]> = {
  TEACHER: [
    { href: "/portal", label: "Overview" },
    { href: "/portal/timetable", label: "Timetable" },
    { href: "/portal/attendance", label: "Attendance" },
    { href: "/portal/homework", label: "Homework" },
    { href: "/portal/leave", label: "Leave" },
  ],
  PARENT: [
    { href: "/portal", label: "Overview" },
    { href: "/portal/attendance", label: "Attendance" },
    { href: "/portal/timetable", label: "Timetable" },
    { href: "/portal/homework", label: "Homework" },
    { href: "/portal/results", label: "Results" },
    { href: "/portal/report-card", label: "Report Card" },
    { href: "/portal/fees", label: "Fees" },
    { href: "/portal/leave", label: "Leave" },
    { href: "/portal/complaints", label: "Complaints" },
  ],
  STUDENT: [
    { href: "/portal", label: "Overview" },
    { href: "/portal/timetable", label: "Timetable" },
    { href: "/portal/attendance", label: "Attendance" },
    { href: "/portal/homework", label: "Homework" },
    { href: "/portal/results", label: "Results" },
    { href: "/portal/report-card", label: "Report Card" },
  ],
};

const ROLE_LABEL: Record<PortalRole, string> = { TEACHER: "Teacher", PARENT: "Parent", STUDENT: "Student" };

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { role, setRole, activeChildId, setActiveChildId } = usePortal();
  const pathname = usePathname();
  const parent = mockParents.find((p) => p.id === PORTAL_DEMO.parentId);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">R</div>
          <span className="text-sm font-semibold text-foreground">Rise Campus Portal</span>
        </div>
        <div className="flex items-center gap-2">
          {role === "PARENT" && parent && parent.children.length > 1 && (
            <Select value={activeChildId} onValueChange={(v) => v && setActiveChildId(v)}>
              <SelectTrigger className="w-40">
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
          <Select value={role} onValueChange={(v) => setRole(v as PortalRole)}>
            <SelectTrigger className="w-32">
              <SelectValue>{(v) => ROLE_LABEL[v as PortalRole]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEACHER">Teacher</SelectItem>
              <SelectItem value="PARENT">Parent</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border pb-2">
        {NAV[role].map((item) => {
          const isActive = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
