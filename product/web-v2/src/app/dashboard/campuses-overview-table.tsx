import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { cn } from "@/lib/utils";
import type { CampusOverview } from "@/lib/mock/campuses";

function feeTone(pct: number): StatusTone {
  if (pct >= 90) return "success";
  if (pct >= 80) return "warning";
  return "danger";
}

export function CampusesOverviewTable({ campuses }: { campuses: CampusOverview[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campus</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Teachers</TableHead>
          <TableHead>Pending admissions</TableHead>
          <TableHead>Fee collected</TableHead>
          <TableHead>Attendance today</TableHead>
          <TableHead className="w-8" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {campuses.map((c) => (
          <TableRow key={c.id} className="group">
            <TableCell className="font-medium text-foreground">
              <Link href={`/dashboard/campuses/${c.id}`} className="hover:underline">
                {c.name}
              </Link>
            </TableCell>
            <TableCell className="font-mono tabular-nums">{c.students.toLocaleString()}</TableCell>
            <TableCell className="font-mono tabular-nums">{c.teachers}</TableCell>
            <TableCell>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  c.pendingAdmissions > 0 ? "font-medium text-signal-foreground" : "text-muted-foreground"
                )}
              >
                {c.pendingAdmissions}
              </span>
            </TableCell>
            <TableCell>
              <StatusDot tone={feeTone(c.feeCollectedPct)}>
                <span className="font-mono tabular-nums">{c.feeCollectedPct}%</span>
              </StatusDot>
            </TableCell>
            <TableCell className="font-mono tabular-nums">{c.attendanceTodayPct}%</TableCell>
            <TableCell>
              <Link href={`/dashboard/campuses/${c.id}`} aria-label={`View ${c.name}`}>
                <ChevronRight className="ml-auto size-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
