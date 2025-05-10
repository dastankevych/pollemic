"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ScheduleForm } from "@/components/schedule/schedule-form"
import { ScheduleList } from "@/components/dashboard/schedule-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"

export default function SchedulePage() {
  return (
      <div className="flex flex-col gap-4">
        <DashboardHeader heading="Schedule Surveys" text="Plan and schedule your surveys for automatic distribution." />

        {/* Форма планирования */}
        <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
          <ScheduleForm />
        </Suspense>

        {/* Список расписаний */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Surveys</CardTitle>
            <CardDescription>List of all scheduled surveys</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="p-4 text-center">Loading schedules...</div>}>
              <ScheduleList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
  )
}
