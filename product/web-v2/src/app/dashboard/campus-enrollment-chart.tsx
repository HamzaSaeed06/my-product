"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
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

// Mirrors shadcn's own "Area Chart - Interactive" reference exactly:
// daily data (not monthly averages — averages plot as a near-straight line
// regardless of chart type; day-to-day variance is what makes a trend line
// worth reading), stacked areas, type="natural", per-series linearGradient
// fill, cursor-less dot tooltip, day-range filtering against the data's own
// last date, bordered header row with filters pinned right. Series
// deliberately skip --chart-2 (the geist focus-blue) — that color has
// exactly one job in this system (the focus ring), so the chart uses the
// other three chart tokens instead.
const CAMPUS_SERIES: { key: keyof Omit<EnrollmentPoint, "date">; campusId: string; label: string; color: string }[] = [
  { key: "hilltop", campusId: "cmp_hilltop", label: "Hilltop", color: "var(--chart-5)" },
  { key: "riverside", campusId: "cmp_riverside", label: "Riverside", color: "var(--chart-4)" },
  { key: "north", campusId: "cmp_north", label: "North Town", color: "var(--chart-3)" },
  { key: "main", campusId: "cmp_main", label: "Main Campus", color: "var(--chart-1)" },
];

const RANGE_OPTIONS = [
  { value: "90", label: "Last 3 months" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" },
];

const CAMPUS_FILTER_OPTIONS = [{ value: "all", label: "All campuses" }, ...mockCampuses.map((c) => ({ value: c.id, label: c.name }))];

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CampusEnrollmentChart({ data }: { data: EnrollmentPoint[] }) {
  const [range, setRange] = useState("90");
  const [campus, setCampus] = useState("all");

  const filteredData = useMemo(() => {
    const lastPoint = data[data.length - 1];
    if (!lastPoint) return data;
    const startDate = new Date(lastPoint.date);
    startDate.setDate(startDate.getDate() - Number(range));
    return data.filter((point) => new Date(point.date) >= startDate);
  }, [data, range]);

  const visibleSeries = campus === "all" ? CAMPUS_SERIES : CAMPUS_SERIES.filter((s) => s.campusId === campus);

  const chartConfig = useMemo(
    () => Object.fromEntries(visibleSeries.map((s) => [s.key, { label: s.label, color: s.color }])) as ChartConfig,
    [visibleSeries]
  );

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Enrollment trend</CardTitle>
          <CardDescription>Super Admin&apos;s home is monitoring, not data entry.</CardDescription>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Select value={campus} onValueChange={(v) => setCampus(v ?? "all")}>
            <SelectTrigger className="w-[150px] rounded-lg" aria-label="Select a campus">
              <SelectValue>{(value: string) => CAMPUS_FILTER_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CAMPUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v ?? "90")}>
            <SelectTrigger className="w-[150px] rounded-lg" aria-label="Select a range">
              <SelectValue>{(value: string) => RANGE_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              {visibleSeries.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatShortDate}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(value) => formatShortDate(value)} />}
            />
            {visibleSeries.map((s) => (
              <Area
                key={s.key}
                dataKey={s.key}
                type="natural"
                fill={`url(#fill-${s.key})`}
                stroke={s.color}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
