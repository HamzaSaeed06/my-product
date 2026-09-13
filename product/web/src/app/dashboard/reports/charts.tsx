"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface Point {
  label: string;
  value: number;
}

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      No data yet.
    </div>
  );
}

// Every chart here follows shadcn/ui's own official chart pattern exactly
// (ui.shadcn.com/docs/components/base/chart): a themed ChartContainer
// wrapping bare Recharts primitives, ChartTooltip + ChartTooltipContent for
// the hover card, colors sourced from globals.css's --chart-1..5 tokens —
// never a hand-rolled <Tooltip /> or hardcoded hex.
export function BarChartCard({ title, data }: { title: string; data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={data.length > 8 ? -30 : 0}
                textAnchor={data.length > 8 ? "end" : "middle"}
                height={data.length > 8 ? 50 : 24}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
              <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function LineChartCard({ title, data }: { title: string; data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
              <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent hideLabel />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-value)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// The gradient-fill variant (Total Revenue / trend-overview style cards) —
// same data shape, different visual treatment. Not used everywhere; reach
// for it when the emphasis is cumulative magnitude, not point-to-point
// comparison (LineChartCard).
export function AreaChartCard({ title, data }: { title: string; data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
              <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent hideLabel />} />
              <Area type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} fill="url(#fillValue)" />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
