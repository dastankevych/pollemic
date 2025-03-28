"use client"

import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { question: "Q1", excellent: 45, good: 30, average: 15, poor: 10 },
  { question: "Q2", excellent: 50, good: 25, average: 15, poor: 10 },
  { question: "Q3", excellent: 30, good: 40, average: 20, poor: 10 },
  { question: "Q4", excellent: 40, good: 35, average: 15, poor: 10 },
  { question: "Q5", excellent: 35, good: 30, average: 25, poor: 10 },
]

export function ResultsOverview() {
  const [selectedSurvey, setSelectedSurvey] = useState("course-feedback")

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select a survey" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="course-feedback">Course Feedback</SelectItem>
            <SelectItem value="teaching-evaluation">Teaching Evaluation</SelectItem>
            <SelectItem value="student-satisfaction">Student Satisfaction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ChartContainer
            config={{
              excellent: {
                label: "Excellent",
                color: "hsl(var(--chart-1))",
              },
              good: {
                label: "Good",
                color: "hsl(var(--chart-2))",
              },
              average: {
                label: "Average",
                color: "hsl(var(--chart-3))",
              },
              poor: {
                label: "Poor",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="question" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="excellent" stackId="a" fill="var(--color-excellent)" />
                <Bar dataKey="good" stackId="a" fill="var(--color-good)" />
                <Bar dataKey="average" stackId="a" fill="var(--color-average)" />
                <Bar dataKey="poor" stackId="a" fill="var(--color-poor)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-medium">Response Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Excellent</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: "45%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Good</span>
                <span className="text-sm font-medium">30%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: "30%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average</span>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: "15%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Poor</span>
                <span className="text-sm font-medium">10%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: "10%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-medium">Key Insights</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2 rounded-full bg-primary p-1 text-primary-foreground">•</span>
                <span>Most students rated the course content as excellent</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 rounded-full bg-primary p-1 text-primary-foreground">•</span>
                <span>Teaching methods received mostly good ratings</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 rounded-full bg-primary p-1 text-primary-foreground">•</span>
                <span>Assessment methods need improvement</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 rounded-full bg-primary p-1 text-primary-foreground">•</span>
                <span>Overall satisfaction increased by 15% from last semester</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

