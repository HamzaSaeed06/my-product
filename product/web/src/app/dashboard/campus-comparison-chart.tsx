"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CampusOverview {
  id: string;
  name: string;
  students: number;
  teachers: number;
  sections: number;
  pendingAdmissions: number;
}

const METRICS = [
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "sections", label: "Sections" },
  { key: "pendingAdmissions", label: "Pending admissions" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

// The real comparison feature this dashboard was missing: switching the
// metric actually re-renders the chart against a different field of the
// same already-fetched perCampus data — no new request, no relabeled-only
// illusion of interactivity.
export function CampusComparisonChart({ perCampus }: { perCampus: CampusOverview[] }) {
  const [metric, setMetric] = useState<MetricKey>("students");

  const data = perCampus.map((c) => ({ label: c.name, value: c[metric] }));
  const activeLabel = METRICS.find((m) => m.key === metric)!.label;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-sm font-medium">{activeLabel} by campus</CardTitle>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <TabsList>
            {METRICS.map((m) => (
              <TabsTrigger key={m.key} value={m.key}>
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data yet.</div>
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} allowDecimals={false} />
              <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
