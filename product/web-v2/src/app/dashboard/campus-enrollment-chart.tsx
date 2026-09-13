"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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

// Plain lines, no area fill underneath — the source design system's own
// restraint applies here too: a gradient wash under a trend line is
// decoration competing with the data, not a reading aid.
export function CampusEnrollmentChart({ data }: { data: EnrollmentPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment trend</CardTitle>
        <CardDescription>Last 6 months, by campus. Super Admin&apos;s home is monitoring, not data entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <LineChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="main" type="linear" stroke="var(--color-main)" strokeWidth={2} dot={false} />
            <Line dataKey="north" type="linear" stroke="var(--color-north)" strokeWidth={2} dot={false} />
            <Line dataKey="riverside" type="linear" stroke="var(--color-riverside)" strokeWidth={2} dot={false} />
            <Line dataKey="hilltop" type="linear" stroke="var(--color-hilltop)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
