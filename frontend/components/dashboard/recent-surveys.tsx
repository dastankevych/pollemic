import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Eye } from "lucide-react"
import Link from "next/link"

const recentSurveys = [
  {
    id: "1",
    name: "Course Feedback",
    status: "Active",
    responses: 45,
    created: "2 days ago",
  },
  {
    id: "2",
    name: "Teaching Evaluation",
    status: "Active",
    responses: 32,
    created: "3 days ago",
  },
  {
    id: "3",
    name: "Student Satisfaction",
    status: "Draft",
    responses: 0,
    created: "5 days ago",
  },
  {
    id: "4",
    name: "Learning Experience",
    status: "Completed",
    responses: 78,
    created: "1 week ago",
  },
]

export function RecentSurveys() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Responses</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentSurveys.map((survey) => (
          <TableRow key={survey.id}>
            <TableCell className="font-medium">{survey.name}</TableCell>
            <TableCell>
              <Badge
                variant={survey.status === "Active" ? "default" : survey.status === "Draft" ? "outline" : "secondary"}
              >
                {survey.status}
              </Badge>
            </TableCell>
            <TableCell>{survey.responses}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/dashboard/surveys/${survey.id}`}>
                  <Button size="icon" variant="ghost">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </Link>
                <Link href={`/dashboard/results/${survey.id}`}>
                  <Button size="icon" variant="ghost">
                    <BarChart className="h-4 w-4" />
                    <span className="sr-only">Results</span>
                  </Button>
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

