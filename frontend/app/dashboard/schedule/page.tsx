"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScheduleList } from "@/components/dashboard/schedule-list"
import { useToast } from "@/hooks/use-toast"
import { getSurveys, Survey } from "@/services/survey-service"
import { assignQuestionnaire, getActiveGroups, Group } from "@/services/schedule-service"

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSurvey, setSelectedSurvey] = useState<string>("")
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [recurrence, setRecurrence] = useState<string>("once")
  const [isLoading, setIsLoading] = useState(false)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch available surveys
        const surveysData = await getSurveys()
        setSurveys(surveysData)

        // Fetch available groups
        const groupsData = await getActiveGroups()
        setGroups(groupsData)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "There was an error loading surveys and groups."
        })
      }
    }

    fetchData()
  }, [toast])

  const handleScheduleSurvey = async () => {
    if (!selectedSurvey) {
      toast({
        variant: "destructive",
        title: "No survey selected",
        description: "Please select a survey to schedule."
      })
      return
    }

    if (!selectedGroup) {
      toast({
        variant: "destructive",
        title: "No group selected",
        description: "Please select a target group."
      })
      return
    }

    if (!date) {
      toast({
        variant: "destructive",
        title: "No date selected",
        description: "Please select a due date for the survey."
      })
      return
    }

    setIsLoading(true);

    try {
      // Prepare the due date in ISO format
      const dueDate = new Date(date);
      // Set time to end of day (23:59:59)
      dueDate.setHours(23, 59, 59);

      // Remove the timezone information from the ISO string
      // This will create a timezone-naive datetime string
      const dueDateString = dueDate.toISOString().replace('Z', '');

      const questionnaireId = parseInt(selectedSurvey);
      const groupId = parseInt(selectedGroup);

      // Create the assignment
      await assignQuestionnaire(questionnaireId, {
        group_id: groupId,
        due_date: dueDateString
      });

      setRefreshTrigger(prev => prev + 1);

      toast({
        title: "Survey scheduled",
        description: "The survey has been scheduled successfully."
      })

      // Reset form
      setSelectedSurvey("")
      setSelectedGroup("")
      setRecurrence("once")
      
      // Force refresh the schedule list (it will refetch data on mount)
      // This is a simple approach - in a real app, you might use a context or state management
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to schedule survey",
        description: error instanceof Error ? error.message : "An unexpected error occurred."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Schedule Surveys" text="Plan and schedule your surveys for automatic distribution." />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr,auto]">
        <Card>
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
                  {surveys.length === 0 ? (
                    <SelectItem value="loading" disabled>Loading surveys...</SelectItem>
                  ) : (
                    surveys.map((survey) => (
                      <SelectItem key={survey.id} value={survey.id.toString()}>
                        {survey.title}
                      </SelectItem>
                    ))
                  )}
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
                  {groups.length === 0 ? (
                    <SelectItem value="loading" disabled>Loading groups...</SelectItem>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.group_id} value={group.group_id.toString()}>
                        {group.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
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

            <Button 
              className="w-full mt-4" 
              onClick={handleScheduleSurvey}
              disabled={isLoading}
            >
              {isLoading ? "Scheduling..." : "Schedule Survey"}
            </Button>
          </CardContent>
        </Card>

        <Card className="w-fit">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select dates to schedule surveys</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Surveys</CardTitle>
          <CardDescription>View and manage your scheduled surveys</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleList refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  )
}