"use client"

import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const timeData = [
  { month: "Jan", current: 78, previous: 65 },
  { month: "Feb", current: 82, previous: 68 },
  { month: "Mar", current: 75, previous: 70 },
  { month: "Apr", current: 85, previous: 72 },
  { month: "May", current: 80, previous: 75 },
  { month: "Jun", current: 88, previous: 78 },
]

const groupData = [
  { question: "Q1", groupA: 85, groupB: 70 },
  { question: "Q2", groupA: 80, groupB: 75 },
  { question: "Q3", groupA: 90, groupB: 65 },
  { question: "Q4", groupA: 75, groupB: 80 },
  { question: "Q5", groupA: 85, groupB: 75 },
]

export function ResultsComparison() {
  const [selectedSurvey, setSelectedSurvey] = useState("course-feedback")
  const [selectedTimeframe, setSelectedTimeframe] = useState("semester")
  const [selectedGroups, setSelectedGroups] = useState("year-groups")

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

      <Tabs defaultValue="time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time">Time Comparison</TabsTrigger>
          <TabsTrigger value="groups">Group Comparison</TabsTrigger>
        </TabsList>
        <TabsContent value="time" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semester">Current vs Last Semester</SelectItem>
                <SelectItem value="year">Current vs Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  current: {
                    label: "Current Period",
                    color: "hsl(var(--chart-1))",
                  },
                  previous: {
                    label: "Previous Period",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="current"
                      strokeWidth={2}
                      stroke="var(--color-current)"
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="previous" strokeWidth={2} stroke="var(--color-previous)" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedGroups} onValueChange={setSelectedGroups}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year-groups">First Year vs Second Year</SelectItem>
                <SelectItem value="departments">CS vs Engineering</SelectItem>
                <SelectItem value="custom">Custom Groups</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  groupA: {
                    label: "Group A",
                    color: "hsl(var(--chart-1))",
                  },
                  groupB: {
                    label: "Group B",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={groupData}>
                    <XAxis dataKey="question" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="groupA"
                      strokeWidth={2}
                      stroke="var(--color-groupA)"
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="groupB" strokeWidth={2} stroke="var(--color-groupB)" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

