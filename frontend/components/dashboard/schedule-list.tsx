import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"

const scheduledSurveys = [
  {
    id: "1",
    name: "Course Feedback",
    date: "2023-04-15",
    recurrence: "Once",
    target: "All Students",
    status: "Scheduled",
  },
  {
    id: "2",
    name: "Teaching Evaluation",
    date: "2023-04-20",
    recurrence: "Weekly",
    target: "Computer Science",
    status: "Scheduled",
  },
  {
    id: "3",
    name: "Student Satisfaction",
    date: "2023-05-01",
    recurrence: "Monthly",
    target: "First Year Students",
    status: "Scheduled",
  },
  {
    id: "4",
    name: "Learning Experience",
    date: "2023-04-10",
    recurrence: "Once",
    target: "Engineering",
    status: "Sent",
  },
]

export function ScheduleList() {
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
        {scheduledSurveys.map((survey) => (
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

