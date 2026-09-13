import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CampusOverview } from "@/lib/mock/campuses";

function feeBadgeVariant(pct: number): "default" | "secondary" | "destructive" {
  if (pct >= 90) return "default";
  if (pct >= 80) return "secondary";
  return "destructive";
}

export function CampusesOverviewTable({ campuses }: { campuses: CampusOverview[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campus</TableHead>
          <TableHead className="text-right">Students</TableHead>
          <TableHead className="text-right">Teachers</TableHead>
          <TableHead className="text-right">Pending admissions</TableHead>
          <TableHead className="text-right">Fee collected</TableHead>
          <TableHead className="text-right">Attendance today</TableHead>
          <TableHead className="w-8" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {campuses.map((c) => (
          <TableRow key={c.id} className="group">
            <TableCell className="font-medium text-foreground">{c.name}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{c.students.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{c.teachers}</TableCell>
            <TableCell className="text-right">
              {c.pendingAdmissions > 0 ? (
                <Badge variant="outline" className="border-signal/40 bg-signal/10 text-signal-foreground">
                  {c.pendingAdmissions}
                </Badge>
              ) : (
                <span className="font-mono tabular-nums text-muted-foreground">0</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={feeBadgeVariant(c.feeCollectedPct)}>{c.feeCollectedPct}%</Badge>
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">{c.attendanceTodayPct}%</TableCell>
            <TableCell>
              {/* Campus drill-down page lands in Phase B (Institute & Structure batch) — affordance shown now, not wired yet. */}
              <ChevronRight className="ml-auto size-4 text-muted-foreground/40" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
