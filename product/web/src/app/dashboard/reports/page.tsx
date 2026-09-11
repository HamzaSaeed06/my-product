import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CATEGORIES = [
  { href: "/dashboard/reports/academic", title: "Academic", description: "Student/class/subject performance, teacher performance, curriculum progress, pass/fail rates." },
  { href: "/dashboard/reports/attendance", title: "Attendance", description: "Daily attendance, monthly summary, student-wise and class-wise breakdowns, absence trends." },
  { href: "/dashboard/reports/financial", title: "Financial", description: "Daily/monthly collection, outstanding fees, discounts/waivers, campus revenue, cashier reports, reconciliation." },
  { href: "/dashboard/reports/admissions", title: "Admissions", description: "Applications received, approved/rejected, enrollment trends, class capacity utilization." },
  { href: "/dashboard/reports/staff", title: "Staff", description: "Teacher workload, attendance, and approved-leave statistics." },
] as const;

export default function ReportCenterPage() {
  return (
    <div>
      <PageHeader title="Report Center" description="Predefined reports, computed live from real data. Browse by category." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-colors hover:bg-secondary/40">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
