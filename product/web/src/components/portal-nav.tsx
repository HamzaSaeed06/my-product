"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  CheckSquare,
  BookOpen,
  Award,
  Wallet,
  Plane,
  MessageSquare,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_BY_ROLE = {
  TEACHER: [
    { href: "/portal", label: "Overview", icon: Home },
    { href: "/portal/timetable", label: "Timetable", icon: CalendarDays },
    { href: "/portal/attendance", label: "Attendance", icon: CheckSquare },
    { href: "/portal/homework", label: "Homework", icon: BookOpen },
    { href: "/portal/leave", label: "Leave", icon: Plane },
  ],
  PARENT: [
    { href: "/portal", label: "Overview", icon: Home },
    { href: "/portal/attendance", label: "Attendance", icon: CheckSquare },
    { href: "/portal/timetable", label: "Timetable", icon: CalendarDays },
    { href: "/portal/homework", label: "Homework", icon: BookOpen },
    { href: "/portal/results", label: "Results", icon: Award },
    { href: "/portal/fees", label: "Fees", icon: Wallet },
    { href: "/portal/leave", label: "Leave", icon: Plane },
    { href: "/portal/complaints", label: "Complaints", icon: MessageSquare },
  ],
  STUDENT: [
    { href: "/portal", label: "Overview", icon: Home },
    { href: "/portal/timetable", label: "Timetable", icon: CalendarDays },
    { href: "/portal/attendance", label: "Attendance", icon: CheckSquare },
    { href: "/portal/homework", label: "Homework", icon: BookOpen },
    { href: "/portal/results", label: "Results", icon: Award },
    { href: "/portal/report-card", label: "Report Card", icon: FileText },
  ],
} as const;

export function PortalNav({ role }: { role: keyof typeof NAV_BY_ROLE }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2">
      {items.map((item) => {
        const isActive = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
