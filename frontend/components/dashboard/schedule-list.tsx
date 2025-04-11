"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import { getScheduledSurveys, ScheduledSurvey } from "@/services/schedule-service"
import { useToast } from "@/hooks/use-toast"

export function ScheduleList({ refreshTrigger = 0 }) {
  const [surveys, setSurveys] = useState<ScheduledSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchScheduledSurveys() {
      setIsLoading(true);
      try {
        const data = await getScheduledSurveys();
        setSurveys(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load scheduled surveys",
          description: "There was an error loading your scheduled surveys."
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchScheduledSurveys();
  }, [toast, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-muted-foreground">Loading scheduled surveys...</p>
      </div>
    )
  }

  if (surveys.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-muted-foreground">No scheduled surveys found. Schedule a survey to see it here.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Survey Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Recurrence</TableHead>
          <TableHead>Target Group</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {surveys.map((survey) => (
          <TableRow key={survey.id}>
            <TableCell className="font-medium">{survey.name}</TableCell>
            <TableCell>{survey.date}</TableCell>
            <TableCell>{survey.recurrence}</TableCell>
            <TableCell>{survey.target}</TableCell>
            <TableCell>
              <Badge variant={survey.status === "Scheduled" ? "outline" : "secondary"}>{survey.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="icon" variant="ghost">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button size="icon" variant="ghost">
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}