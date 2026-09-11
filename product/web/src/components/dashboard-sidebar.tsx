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
  {
    label: "Academic Operations",
    items: [
      { href: "/dashboard/timetable", label: "Timetable" },
      { href: "/dashboard/attendance", label: "Attendance" },
      { href: "/dashboard/teacher-attendance", label: "Teacher Attendance" },
      { href: "/dashboard/substitutions", label: "Substitutions" },
      { href: "/dashboard/curriculum", label: "Curriculum" },
      { href: "/dashboard/homework", label: "Homework" },
      { href: "/dashboard/assessments", label: "Assessments" },
    ],
  },
  {
    label: "Results & Promotion",
    items: [
      { href: "/dashboard/exams", label: "Exams" },
      { href: "/dashboard/results", label: "Results" },
      { href: "/dashboard/report-cards", label: "Report Cards" },
      { href: "/dashboard/promotions", label: "Promotions" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/fee-structures", label: "Fee Structures" },
      { href: "/dashboard/student-fees", label: "Student Fees" },
      { href: "/dashboard/invoices", label: "Invoices" },
      { href: "/dashboard/payments", label: "Payments" },
      { href: "/dashboard/refunds", label: "Refunds" },
      { href: "/dashboard/discounts", label: "Discounts" },
      { href: "/dashboard/waivers", label: "Waivers" },
      { href: "/dashboard/cash-closing", label: "Cash Closing" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/leaves", label: "Leaves" },
      { href: "/dashboard/complaints", label: "Complaints" },
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
