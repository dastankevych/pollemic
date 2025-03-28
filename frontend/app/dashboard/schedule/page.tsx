"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScheduleList } from "@/components/dashboard/schedule-list"

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSurvey, setSelectedSurvey] = useState<string>("")
  const [selectedGroup, setSelectedGroup] = useState<string>("")

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Schedule Surveys" text="Plan and schedule your surveys for automatic distribution." />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select dates to schedule surveys</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Schedule New Survey</CardTitle>
            <CardDescription>Configure survey distribution settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="survey">Select Survey</Label>
              <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                <SelectTrigger id="survey">
                  <SelectValue placeholder="Select a survey" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course-feedback">Course Feedback</SelectItem>
                  <SelectItem value="teaching-evaluation">Teaching Evaluation</SelectItem>
                  <SelectItem value="student-satisfaction">Student Satisfaction</SelectItem>
                  <SelectItem value="learning-experience">Learning Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Target Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-students">All Students</SelectItem>
                  <SelectItem value="first-year">First Year Students</SelectItem>
                  <SelectItem value="second-year">Second Year Students</SelectItem>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <Select>
                <SelectTrigger id="recurrence">
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semester">Each Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4">Schedule Survey</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Surveys</CardTitle>
          <CardDescription>View and manage your scheduled surveys</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleList />
        </CardContent>
      </Card>
    </div>
  )
}

