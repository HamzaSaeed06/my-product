"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users as UsersIcon,
  Building2,
  CalendarRange,
  School,
  Rows3,
  UserCog,
  GraduationCap,
  ClipboardList,
  Contact,
  UserSquare2,
  UsersRound,
  BookMarked,
  CalendarClock,
  CalendarCheck,
  UserCheck,
  Repeat,
  NotebookText,
  BookOpenCheck,
  FileCheck2,
  ClipboardCheck,
  FileBadge2,
  ArrowUpCircle,
  Receipt,
  Wallet,
  CreditCard,
  Undo2,
  Percent,
  BadgePercent,
  Banknote,
  RefreshCcw,
  Landmark,
  CalendarOff,
  MessageSquareWarning,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Each nav item's visibility is driven by the SAME permission key the
// backend route actually enforces (confirmed against every module's
// routes.ts, not guessed) — never a hand-maintained per-role list. That
// hand-maintained version drifted for real: it hid "Leaves" from INCHARGE
// (which holds leave.approve/leave.reject — the entire point of Phase 11
// Phase B's auto-routing) and "Users" from CAMPUS_HEAD (which holds
// user.view), simply because nobody remembered to update the sidebar when
// those permissions were granted. Keying off the live `permissions` array
// from /auth/me makes that whole class of drift structurally impossible —
// a role sees exactly what it's actually authorized to reach, forever, with
// zero maintenance here when permissions change.
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** At least one of these must be in the actor's permission set. Omit for "always visible to any staff role". */
  anyOf?: string[];
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Administration",
    items: [{ href: "/dashboard/users", label: "Users", icon: UsersIcon, anyOf: ["user.view"] }],
  },
  {
    label: "Institute Structure",
    items: [
      { href: "/dashboard/institute", label: "Institute", icon: Landmark, anyOf: ["institute.view"] },
      { href: "/dashboard/campuses", label: "Campuses", icon: Building2, anyOf: ["campus.view"] },
      { href: "/dashboard/academic-years", label: "Academic Years", icon: CalendarRange, anyOf: ["academic_year.view"] },
      { href: "/dashboard/classes", label: "Classes", icon: School, anyOf: ["class.view"] },
      { href: "/dashboard/sections", label: "Sections", icon: Rows3, anyOf: ["section.view"] },
      { href: "/dashboard/incharge-scopes", label: "Incharge Scopes", icon: UserCog, anyOf: ["incharge_scope.view"] },
    ],
  },
  {
    label: "Academic Structure",
    items: [
      { href: "/dashboard/students", label: "Students", icon: GraduationCap, anyOf: ["student.view"] },
      { href: "/dashboard/admissions", label: "Admissions", icon: ClipboardList, anyOf: ["admission.view"] },
      { href: "/dashboard/parents", label: "Parents", icon: Contact, anyOf: ["parent.view"] },
      { href: "/dashboard/teachers", label: "Teachers", icon: UserSquare2, anyOf: ["teacher.view"] },
      { href: "/dashboard/teacher-assignments", label: "Teacher Assignments", icon: UsersRound, anyOf: ["teacher_assignment.view"] },
      { href: "/dashboard/subjects", label: "Subjects", icon: BookMarked, anyOf: ["subject.view"] },
    ],
  },
  {
    label: "Academic Operations",
    items: [
      { href: "/dashboard/timetable", label: "Timetable", icon: CalendarClock, anyOf: ["timetable.view"] },
      { href: "/dashboard/attendance", label: "Attendance", icon: CalendarCheck, anyOf: ["attendance.view"] },
      { href: "/dashboard/teacher-attendance", label: "Teacher Attendance", icon: UserCheck, anyOf: ["teacher_attendance.view"] },
      { href: "/dashboard/substitutions", label: "Substitutions", icon: Repeat, anyOf: ["substitution.view"] },
      { href: "/dashboard/curriculum", label: "Curriculum", icon: NotebookText, anyOf: ["curriculum.view"] },
      { href: "/dashboard/homework", label: "Homework", icon: BookOpenCheck, anyOf: ["homework.view"] },
      { href: "/dashboard/assessments", label: "Assessments", icon: FileCheck2, anyOf: ["assessment.view"] },
    ],
  },
  {
    label: "Results & Promotion",
    items: [
      { href: "/dashboard/exams", label: "Exams", icon: ClipboardCheck, anyOf: ["exam.view"] },
      { href: "/dashboard/results", label: "Results", icon: FileBadge2, anyOf: ["result.view"] },
      { href: "/dashboard/report-cards", label: "Report Cards", icon: FileBadge2, anyOf: ["report_card.view"] },
      { href: "/dashboard/promotions", label: "Promotions", icon: ArrowUpCircle, anyOf: ["promotion.view"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/fee-structures", label: "Fee Structures", icon: Receipt, anyOf: ["fee_structure.view"] },
      { href: "/dashboard/student-fees", label: "Student Fees", icon: Wallet, anyOf: ["fee_assignment.view"] },
      { href: "/dashboard/invoices", label: "Invoices", icon: Receipt, anyOf: ["invoice.view"] },
      { href: "/dashboard/payments", label: "Payments", icon: CreditCard, anyOf: ["payment.view"] },
      { href: "/dashboard/refunds", label: "Refunds", icon: Undo2, anyOf: ["refund.view"] },
      { href: "/dashboard/discounts", label: "Discounts", icon: Percent, anyOf: ["discount.view"] },
      { href: "/dashboard/waivers", label: "Waivers", icon: BadgePercent, anyOf: ["waiver.view"] },
      { href: "/dashboard/cash-closing", label: "Cash Closing", icon: Banknote, anyOf: ["cash_closing.view"] },
      { href: "/dashboard/reconciliation", label: "Reconciliation", icon: RefreshCcw, anyOf: ["payment.view"] },
      { href: "/dashboard/payment-gateways", label: "Payment Gateways", icon: Landmark, anyOf: ["payment_gateway.manage"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/leaves", label: "Leaves", icon: CalendarOff, anyOf: ["leave.view"] },
      { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning, anyOf: ["complaint.view"] },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        href: "/dashboard/reports",
        label: "Report Center",
        icon: BarChart3,
        anyOf: ["report.view_academic", "report.view_attendance", "report.view_financial", "report.view_admissions", "report.view_staff"],
      },
    ],
  },
];

export function DashboardSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const has = (key: string) => permissions.includes(key);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.anyOf || item.anyOf.some(has)),
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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
