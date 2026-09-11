"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Which of the 4 "desktop admin" roles (Phase 7) sees each nav item — a
// filtered view of the SAME screens, not a rebuild, since the backend's
// scope.ts already narrows what data comes back for INCHARGE. SUPER_ADMIN
// always sees everything, so it's omitted from every list below rather
// than repeated on every item. TEACHER/PARENT/STUDENT get their own
// dedicated portal shell instead of this sidebar entirely — see
// dashboard/layout.tsx.
type StaffRole = "PRINCIPAL" | "INCHARGE" | "OFFICE";

const NAV_GROUPS = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Overview", roles: ["PRINCIPAL", "INCHARGE", "OFFICE"] as StaffRole[] }],
  },
  {
    label: "Institute Structure",
    items: [
      { href: "/dashboard/institute", label: "Institute", roles: ["PRINCIPAL"] as StaffRole[] },
      { href: "/dashboard/campuses", label: "Campuses", roles: ["PRINCIPAL"] as StaffRole[] },
      { href: "/dashboard/academic-years", label: "Academic Years", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/classes", label: "Classes", roles: ["PRINCIPAL", "INCHARGE", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/sections", label: "Sections", roles: ["PRINCIPAL", "INCHARGE", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/incharge-scopes", label: "Incharge Scopes", roles: [] as StaffRole[] },
    ],
  },
  {
    label: "Academic Structure",
    items: [
      { href: "/dashboard/students", label: "Students", roles: ["PRINCIPAL", "INCHARGE", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/admissions", label: "Admissions", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/parents", label: "Parents", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/teachers", label: "Teachers", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/teacher-assignments", label: "Teacher Assignments", roles: ["PRINCIPAL"] as StaffRole[] },
      { href: "/dashboard/subjects", label: "Subjects", roles: ["PRINCIPAL"] as StaffRole[] },
    ],
  },
  {
    label: "Academic Operations",
    items: [
      { href: "/dashboard/timetable", label: "Timetable", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/attendance", label: "Attendance", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/teacher-attendance", label: "Teacher Attendance", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/substitutions", label: "Substitutions", roles: ["PRINCIPAL"] as StaffRole[] },
      { href: "/dashboard/curriculum", label: "Curriculum", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/homework", label: "Homework", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/assessments", label: "Assessments", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
    ],
  },
  {
    label: "Results & Promotion",
    items: [
      { href: "/dashboard/exams", label: "Exams", roles: ["PRINCIPAL"] as StaffRole[] },
      { href: "/dashboard/results", label: "Results", roles: ["PRINCIPAL", "INCHARGE"] as StaffRole[] },
      { href: "/dashboard/report-cards", label: "Report Cards", roles: ["PRINCIPAL"] as StaffRole[] },
      { href: "/dashboard/promotions", label: "Promotions", roles: ["PRINCIPAL"] as StaffRole[] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/fee-structures", label: "Fee Structures", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/student-fees", label: "Student Fees", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/invoices", label: "Invoices", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/payments", label: "Payments", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/refunds", label: "Refunds", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/discounts", label: "Discounts", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/waivers", label: "Waivers", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/cash-closing", label: "Cash Closing", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/leaves", label: "Leaves", roles: ["PRINCIPAL", "OFFICE"] as StaffRole[] },
      { href: "/dashboard/complaints", label: "Complaints", roles: ["PRINCIPAL", "INCHARGE", "OFFICE"] as StaffRole[] },
    ],
  },
] as const;

export function DashboardSidebar({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const isSuperAdmin = roles.includes("SUPER_ADMIN");

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isSuperAdmin || item.roles.some((r) => roles.includes(r))),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-3">
      {visibleGroups.map((group) => (
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
