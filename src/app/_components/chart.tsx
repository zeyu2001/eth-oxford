"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { api } from "@/trpc/react";

export function Chart() {
  const { data, isLoading, error } =
    api.semgrep.vulnerabilityStatistics.useQuery();

  if (error) return <p>Error: {error.message}</p>;

  const chartData = [
    {
      type: "info",
      count: isLoading ? 100 : (data?.info ?? 0),
      fill: "var(--color-info)",
    },
    {
      type: "warn",
      count: isLoading ? 100 : (data?.warn ?? 0),
      fill: "var(--color-warn)",
    },
    {
      type: "error",
      count: isLoading ? 100 : (data?.error ?? 0),
      fill: "var(--color-error)",
    },
  ];

  const chartConfig = {
    info: {
      label: "Info",
      color: "hsl(var(--chart-1))",
    },
    warn: {
      label: "Warning",
      color: "hsl(var(--chart-3))",
    },
    error: {
      label: "Error",
      color: "hsl(var(--chart-5))",
    },
  } satisfies ChartConfig;

  const totalVulns = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>
          <h2 className="text-xl font-semibold">Vulnerabilities</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {isLoading ? (
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-muted-foreground"
                          >
                            Loading...
                          </tspan>
                        ) : (
                          <>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalVulns.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 24}
                              className="fill-muted-foreground"
                            >
                              issues found
                            </tspan>
                          </>
                        )}
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
