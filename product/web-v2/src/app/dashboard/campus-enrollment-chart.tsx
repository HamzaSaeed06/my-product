"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { mockCampuses, type EnrollmentPoint } from "@/lib/mock/campuses";

// Chart series intentionally skip --chart-2 (the geist focus-blue) — this
// system's own rule is that saturated blue has exactly one job (the focus
// ring), so a chart uses the other, non-reserved chart tokens instead.
const CAMPUS_SERIES: { key: keyof Omit<EnrollmentPoint, "month">; campusId: string; label: string; color: string }[] = [
  { key: "main", campusId: "cmp_main", label: "Main Campus", color: "var(--chart-1)" },
  { key: "north", campusId: "cmp_north", label: "North Town", color: "var(--chart-3)" },
  { key: "riverside", campusId: "cmp_riverside", label: "Riverside", color: "var(--chart-4)" },
  { key: "hilltop", campusId: "cmp_hilltop", label: "Hilltop", color: "var(--chart-5)" },
];

const RANGE_OPTIONS = [
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
];

export function CampusEnrollmentChart({ data }: { data: EnrollmentPoint[] }) {
  const [range, setRange] = useState("6");
  const [campus, setCampus] = useState("all");

  const filteredData = useMemo(() => data.slice(-Number(range)), [data, range]);
  const visibleSeries = campus === "all" ? CAMPUS_SERIES : CAMPUS_SERIES.filter((s) => s.campusId === campus);

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(visibleSeries.map((s) => [s.key, { label: s.label, color: s.color }])) as ChartConfig,
    [visibleSeries]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment trend</CardTitle>
        <CardDescription>Super Admin&apos;s home is monitoring, not data entry.</CardDescription>
        <CardAction className="flex items-center gap-2">
          <Select value={campus} onValueChange={(v) => setCampus(v ?? "all")}>
            <SelectTrigger className="w-40" size="sm">
              <SelectValue placeholder="Campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campuses</SelectItem>
              {mockCampuses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v ?? "6")}>
            <SelectTrigger className="w-36" size="sm">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={filteredData} margin={{ left: 0, right: 12 }}>
            <defs>
              {visibleSeries.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.03} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            {visibleSeries.map((s) => (
              <Area
                key={s.key}
                dataKey={s.key}
                type="natural"
                stroke={s.color}
                fill={`url(#fill-${s.key})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
