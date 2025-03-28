"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    date: "Jan 1",
    responses: 45,
    participation: 78,
  },
  {
    date: "Jan 5",
    responses: 52,
    participation: 82,
  },
  {
    date: "Jan 10",
    responses: 48,
    participation: 76,
  },
  {
    date: "Jan 15",
    responses: 61,
    participation: 85,
  },
  {
    date: "Jan 20",
    responses: 55,
    participation: 80,
  },
  {
    date: "Jan 25",
    responses: 67,
    participation: 88,
  },
  {
    date: "Jan 30",
    responses: 70,
    participation: 90,
  },
]

export function Overview() {
  return (
    <ChartContainer
      config={{
        responses: {
          label: "Responses",
          color: "hsl(var(--chart-1))",
        },
        participation: {
          label: "Participation Rate (%)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 0,
          }}
        >
          <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="responses"
            strokeWidth={2}
            activeDot={{
              r: 6,
              style: { fill: "var(--color-responses)", opacity: 0.8 },
            }}
            stroke="var(--color-responses)"
          />
          <Line
            type="monotone"
            dataKey="participation"
            strokeWidth={2}
            activeDot={{
              r: 6,
              style: { fill: "var(--color-participation)", opacity: 0.8 },
            }}
            stroke="var(--color-participation)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

