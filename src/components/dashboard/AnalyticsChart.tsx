
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart"

interface AnalyticsChartProps<TData = any> {
  title?: string;
  description?: string;
  data: TData[];
  chartType: "bar" | "line" | "pie";
  config: ChartConfig;
  dataKeys: (keyof TData | { name: keyof TData, stackId?: string })[];
  xAxisDataKey?: keyof TData;
  className?: string;
}

export function AnalyticsChart<TData>({
  title,
  description,
  data,
  chartType,
  config,
  dataKeys,
  xAxisDataKey,
  className,
}: AnalyticsChartProps<TData>) {

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {xAxisDataKey && <XAxis dataKey={xAxisDataKey as string} tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />}
            <YAxis tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {dataKeys.map((keyItem, index) => {
              const keyName = typeof keyItem === 'object' ? keyItem.name as string : keyItem as string;
              const stackId = typeof keyItem === 'object' ? keyItem.stackId : undefined;
              return <Bar key={index} dataKey={keyName} stackId={stackId} fill={`var(--color-${keyName})`} radius={[4, 4, 0, 0]} />;
            })}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {xAxisDataKey && <XAxis dataKey={xAxisDataKey as string} tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />}
            <YAxis tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {dataKeys.map((keyItem, index) => {
               const keyName = typeof keyItem === 'object' ? keyItem.name as string : keyItem as string;
              return <Line key={index} type="monotone" dataKey={keyName} stroke={`var(--color-${keyName})`} strokeWidth={2} dot={false} />;
            })}
          </LineChart>
        );
      case "pie":
        return (
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={"80%"} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
              {data.map((entry: any, index) => (
                 <Cell key={`cell-${index}`} fill={entry.fill || `var(--color-chart-${(index % 5) + 1})`} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        );
      default:
        return <p>Unsupported chart type</p>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="min-h-[200px] w-full aspect-video">
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
