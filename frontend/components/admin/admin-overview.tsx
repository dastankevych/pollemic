"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    name: "Jan",
    surveys: 20,
    responses: 1200,
  },
  {
    name: "Feb",
    surveys: 18,
    responses: 1100,
  },
  {
    name: "Mar",
    surveys: 25,
    responses: 1500,
  },
  {
    name: "Apr",
    surveys: 22,
    responses: 1300,
  },
  {
    name: "May",
    surveys: 30,
    responses: 1800,
  },
  {
    name: "Jun",
    surveys: 28,
    responses: 1600,
  },
]

export function AdminOverview() {
  return (
    <ChartContainer
      config={{
        surveys: {
          label: "Surveys Created",
          color: "hsl(var(--chart-1))",
        },
        responses: {
          label: "Total Responses",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="var(--color-surveys)" />
          <YAxis yAxisId="right" orientation="right" stroke="var(--color-responses)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar yAxisId="left" dataKey="surveys" fill="var(--color-surveys)" />
          <Bar yAxisId="right" dataKey="responses" fill="var(--color-responses)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

