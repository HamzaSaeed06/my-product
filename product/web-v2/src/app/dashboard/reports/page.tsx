import Link from "next/link";
import { GraduationCap, CalendarCheck2, Banknote, ClipboardList, UserSquare2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const REPORTS = [
  { href: "/dashboard/reports/academic", label: "Academic", description: "Results and curriculum progress across classes.", icon: GraduationCap },
  { href: "/dashboard/reports/attendance", label: "Attendance", description: "Student attendance rates by section.", icon: CalendarCheck2 },
  { href: "/dashboard/reports/financial", label: "Financial", description: "Invoicing, collections and outstanding balances.", icon: Banknote },
  { href: "/dashboard/reports/admissions", label: "Admissions", description: "Applications by status and class.", icon: ClipboardList },
  { href: "/dashboard/reports/staff", label: "Staff", description: "Teacher attendance and leave patterns.", icon: UserSquare2 },
];

// A fixed, pre-built report set — deliberately not a custom report
// builder, confirmed as explicitly out of scope in the real backend.
// Every figure below is computed live from existing records, nothing is
// stored here.
export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Five pre-built views, each computed live from existing records — not a custom report builder." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="surface-ring group flex flex-col gap-3 rounded-[var(--card-radius)] p-4 transition-colors hover:bg-accent"
          >
            <report.icon className="size-5 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                {report.label}
                <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="text-xs text-muted-foreground">{report.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
