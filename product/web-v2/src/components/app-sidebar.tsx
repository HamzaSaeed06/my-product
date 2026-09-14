"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users as UsersIcon,
  GraduationCap,
  School,
  Landmark,
  Building2,
  CalendarRange,
  Rows3,
  UserCog,
  UserCheck2,
  Languages,
  SlidersHorizontal,
  Contact,
  UserSquare2,
  BookMarked,
  UsersRound,
  ClipboardList,
  MessageCircleQuestion,
  ClipboardCheck,
  CalendarClock,
  CalendarCheck2,
  UserCheck,
  ScanLine,
  Repeat,
  BookOpen,
  NotebookPen,
  NotebookText,
  PencilLine,
  FileCheck2,
  ListChecks,
  FileBadge2,
  ArrowUpRightFromCircle,
  Receipt,
  Wallet,
  FileStack,
  Percent,
  BadgePercent,
  Banknote,
  RotateCcw,
  Vault,
  Plug,
  ShieldCheck,
  CalendarOff,
  MessageSquareWarning,
  BarChart3,
  ScrollText,
  KeyRound,
  BadgeCheck,
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
      { href: "/dashboard/parents", label: "Parents", icon: Contact, anyOf: ["parent.view"] },
      { href: "/dashboard/teachers", label: "Teachers", icon: UserSquare2, anyOf: ["teacher.view"] },
      { href: "/dashboard/teacher-assignments", label: "Teacher Assignments", icon: UsersRound, anyOf: ["teacher_assignment.view"] },
      { href: "/dashboard/subjects", label: "Subjects", icon: BookMarked, anyOf: ["subject.view"] },
      { href: "/dashboard/users", label: "Users", icon: UsersIcon, anyOf: ["user.view"] },
    ],
  },
  {
    label: "Admissions & Enrollment",
    items: [
      { href: "/dashboard/admissions", label: "Admissions", icon: ClipboardList, anyOf: ["admission.view"] },
      { href: "/dashboard/admission-inquiries", label: "Admission Inquiries", icon: MessageCircleQuestion, anyOf: ["admission_inquiry.view"] },
      { href: "/dashboard/enrollments", label: "Enrollments", icon: ClipboardCheck, anyOf: ["enrollment.view"] },
    ],
  },
  {
    label: "Academic Operations",
    items: [
      { href: "/dashboard/timetable", label: "Timetable", icon: CalendarClock, anyOf: ["timetable.view"] },
      { href: "/dashboard/attendance", label: "Attendance", icon: CalendarCheck2, anyOf: ["attendance.view"] },
      { href: "/dashboard/teacher-attendance", label: "Teacher Attendance", icon: UserCheck, anyOf: ["teacher_attendance.view"] },
      { href: "/dashboard/staff-attendance", label: "Staff Attendance", icon: ScanLine, anyOf: ["staff_attendance.view"] },
      { href: "/dashboard/substitutions", label: "Substitutions", icon: Repeat, anyOf: ["substitution.view"] },
      { href: "/dashboard/curriculum", label: "Curriculum", icon: BookOpen, anyOf: ["curriculum.view"] },
      { href: "/dashboard/homework", label: "Homework", icon: NotebookPen, anyOf: ["homework.view"] },
      { href: "/dashboard/class-diary", label: "Class Diary", icon: NotebookText, anyOf: ["class_diary.view"] },
    ],
  },
  {
    label: "Assessments",
    items: [{ href: "/dashboard/assessments", label: "Assessments", icon: PencilLine, anyOf: ["assessment.view"] }],
  },
  {
    label: "Results & Promotion",
    items: [
      { href: "/dashboard/exams", label: "Exams", icon: FileCheck2, anyOf: ["exam.view"] },
      { href: "/dashboard/results", label: "Results", icon: ListChecks, anyOf: ["result.view"] },
      { href: "/dashboard/report-cards", label: "Report Cards", icon: FileBadge2, anyOf: ["report_card.view"] },
      { href: "/dashboard/promotions", label: "Promotions", icon: ArrowUpRightFromCircle, anyOf: ["promotion.view"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/fee-structures", label: "Fee Structures", icon: Receipt, anyOf: ["fee_structure.view"] },
      { href: "/dashboard/student-fees", label: "Student Fees", icon: Wallet, anyOf: ["fee_assignment.view"] },
      { href: "/dashboard/invoices", label: "Invoices", icon: FileStack, anyOf: ["invoice.view"] },
      { href: "/dashboard/discounts", label: "Discounts", icon: Percent, anyOf: ["discount.view"] },
      { href: "/dashboard/waivers", label: "Waivers", icon: BadgePercent, anyOf: ["waiver.view"] },
      { href: "/dashboard/payments", label: "Payments", icon: Banknote, anyOf: ["payment.view"] },
      { href: "/dashboard/refunds", label: "Refunds", icon: RotateCcw, anyOf: ["refund.view"] },
      { href: "/dashboard/cash-closing", label: "Cash Closing", icon: Vault, anyOf: ["cash_closing.view"] },
      { href: "/dashboard/payment-gateways", label: "Payment Gateways", icon: Plug, anyOf: ["payment_gateway.manage"] },
      { href: "/dashboard/reconciliation", label: "Reconciliation", icon: ShieldCheck, anyOf: ["payment.view"] },
    ],
  },
  {
    label: "Operations & Governance",
    items: [
      { href: "/dashboard/leaves", label: "Leaves", icon: CalendarOff, anyOf: ["leave.view"] },
      { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning, anyOf: ["complaint.view"] },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3, anyOf: ["report.view_academic", "report.view_attendance", "report.view_financial", "report.view_admissions", "report.view_staff", "institute.monitor"] },
      { href: "/dashboard/audit-log", label: "Audit Log", icon: ScrollText, anyOf: ["audit.view"] },
      { href: "/dashboard/roles", label: "Roles & Permissions", icon: KeyRound, anyOf: ["role.view"] },
      // No permission required in the real backend at all (a deliberately
      // public, unauthenticated route — the login screen needs it before
      // any session exists) — the only nav item with no anyOf gate.
      { href: "/dashboard/license", label: "License Status", icon: BadgeCheck },
    ],
  },
  {
    label: "Institute & Structure",
    items: [
      { href: "/dashboard/institute", label: "Institute", icon: Landmark, anyOf: ["institute.view"] },
      { href: "/dashboard/campuses", label: "Campuses", icon: Building2, anyOf: ["campus.view"] },
      { href: "/dashboard/academic-years", label: "Academic Years", icon: CalendarRange, anyOf: ["academic_year.view"] },
      { href: "/dashboard/classes", label: "Classes", icon: School, anyOf: ["class.view"] },
      { href: "/dashboard/sections", label: "Sections", icon: Rows3, anyOf: ["section.view"] },
      { href: "/dashboard/incharge-scopes", label: "Incharge Scopes", icon: UserCog, anyOf: ["incharge_scope.view"] },
      { href: "/dashboard/delegations", label: "Delegations", icon: UserCheck2, anyOf: ["delegation.view"] },
      { href: "/dashboard/terminology", label: "Terminology", icon: Languages, anyOf: ["institute.configure"] },
      { href: "/dashboard/feature-config", label: "Feature Config", icon: SlidersHorizontal, anyOf: ["feature_config.manage"] },
    ],
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
            {group.label ? <SidebarGroupLabel className="label-eyebrow text-sidebar-foreground/60">{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        className="rounded-[var(--nav-radius)]"
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
