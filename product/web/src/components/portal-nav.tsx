"use client";

import { useEffect, useRef, useState } from "react";
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
    { href: "/portal/report-card", label: "Report Card", icon: FileText },
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
  const scrollerRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // PARENT has 9 items — on a phone (the primary audience for this surface,
  // per DESIGN.md's Layout Density) that overflows and scrolls with no
  // visible cue, so "Complaints" (the last pill) silently falls off-screen.
  // Track scroll position to show a fade only on the side that actually has
  // more content, instead of a decorative fade that's always there.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateFades() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [role]);

  return (
    <div className="relative shrink-0 border-b border-border bg-background">
      <nav ref={scrollerRef} className="flex gap-1 overflow-x-auto px-3 py-2">
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
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
