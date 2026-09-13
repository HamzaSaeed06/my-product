"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { EnrollmentPoint } from "@/lib/mock/campuses";

const chartConfig = {
  main: { label: "Main Campus", color: "var(--chart-1)" },
  north: { label: "North Town", color: "var(--chart-2)" },
  riverside: { label: "Riverside", color: "var(--chart-3)" },
  hilltop: { label: "Hilltop", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function CampusEnrollmentChart({ data }: { data: EnrollmentPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment trend</CardTitle>
        <CardDescription>Last 6 months, by campus. Super Admin&apos;s home is monitoring, not data entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area dataKey="main" type="monotone" stroke="var(--color-main)" fill="var(--color-main)" fillOpacity={0.12} strokeWidth={2} />
            <Area dataKey="north" type="monotone" stroke="var(--color-north)" fill="var(--color-north)" fillOpacity={0.1} strokeWidth={2} />
            <Area dataKey="riverside" type="monotone" stroke="var(--color-riverside)" fill="var(--color-riverside)" fillOpacity={0.1} strokeWidth={2} />
            <Area dataKey="hilltop" type="monotone" stroke="var(--color-hilltop)" fill="var(--color-hilltop)" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
