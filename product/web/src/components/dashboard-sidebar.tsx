"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Overview" }],
  },
  {
    label: "Institute Structure",
    items: [
      { href: "/dashboard/institute", label: "Institute" },
      { href: "/dashboard/campuses", label: "Campuses" },
      { href: "/dashboard/academic-years", label: "Academic Years" },
      { href: "/dashboard/classes", label: "Classes" },
      { href: "/dashboard/sections", label: "Sections" },
      { href: "/dashboard/incharge-scopes", label: "Incharge Scopes" },
    ],
  },
  {
    label: "Academic Structure",
    items: [
      { href: "/dashboard/students", label: "Students" },
      { href: "/dashboard/admissions", label: "Admissions" },
      { href: "/dashboard/parents", label: "Parents" },
      { href: "/dashboard/teachers", label: "Teachers" },
      { href: "/dashboard/teacher-assignments", label: "Teacher Assignments" },
      { href: "/dashboard/subjects", label: "Subjects" },
    ],
  },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.label || "root"} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground">{group.label}</p>
          ) : null}
          {group.items.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
