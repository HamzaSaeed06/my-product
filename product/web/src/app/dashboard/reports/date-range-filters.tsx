"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NamedOption {
  id: string;
  name: string;
}

// Shared by Attendance/Financial/Admissions/Staff report pages — a
// date range plus an optional campus picker, since those are the filter
// dimensions spec lists in common across all four ("Filters: Date range,
// campus, class, section").
export function DateRangeFilters({
  basePath,
  dateFrom,
  dateTo,
  campusId,
  campuses,
  extraParams,
}: {
  basePath: string;
  dateFrom: string;
  dateTo: string;
  campusId: string;
  campuses: NamedOption[];
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();

  function navigate(next: { dateFrom?: string; dateTo?: string; campusId?: string }) {
    const params = new URLSearchParams({
      dateFrom: next.dateFrom ?? dateFrom,
      dateTo: next.dateTo ?? dateTo,
      ...extraParams,
    });
    const nextCampus = next.campusId ?? campusId;
    if (nextCampus) params.set("campusId", nextCampus);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="report-date-from" className="text-xs">
          From
        </Label>
        <Input id="report-date-from" type="date" value={dateFrom} onChange={(e) => navigate({ dateFrom: e.target.value })} className="w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="report-date-to" className="text-xs">
          To
        </Label>
        <Input id="report-date-to" type="date" value={dateTo} onChange={(e) => navigate({ dateTo: e.target.value })} className="w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="report-campus" className="text-xs">
          Campus
        </Label>
        <Select value={campusId || "all"} onValueChange={(value) => value && navigate({ campusId: value === "all" ? "" : value })}>
          <SelectTrigger id="report-campus" className="w-48">
            <SelectValue placeholder="All campuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campuses</SelectItem>
            {campuses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
