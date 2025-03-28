"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart, Copy, Edit, Eye, MoreHorizontal, Trash } from "lucide-react"

const surveys = [
  {
    id: "1",
    name: "Course Feedback",
    status: "Active",
    responses: 45,
    created: "2023-03-15",
    updated: "2023-03-20",
  },
  {
    id: "2",
    name: "Teaching Evaluation",
    status: "Active",
    responses: 32,
    created: "2023-03-10",
    updated: "2023-03-18",
  },
  {
    id: "3",
    name: "Student Satisfaction",
    status: "Draft",
    responses: 0,
    created: "2023-03-05",
    updated: "2023-03-05",
  },
  {
    id: "4",
    name: "Learning Experience",
    status: "Completed",
    responses: 78,
    created: "2023-02-28",
    updated: "2023-03-14",
  },
  {
    id: "5",
    name: "Curriculum Feedback",
    status: "Active",
    responses: 21,
    created: "2023-02-20",
    updated: "2023-03-12",
  },
  {
    id: "6",
    name: "Classroom Environment",
    status: "Completed",
    responses: 65,
    created: "2023-02-15",
    updated: "2023-03-01",
  },
  {
    id: "7",
    name: "Technology Usage",
    status: "Draft",
    responses: 0,
    created: "2023-02-10",
    updated: "2023-02-10",
  },
]

export function SurveysTable() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSurveys = surveys.filter((survey) => survey.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search surveys..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responses</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSurveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No surveys found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSurveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">{survey.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        survey.status === "Active" ? "default" : survey.status === "Draft" ? "outline" : "secondary"
                      }
                    >
                      {survey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{survey.responses}</TableCell>
                  <TableCell>{survey.created}</TableCell>
                  <TableCell>{survey.updated}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart className="mr-2 h-4 w-4" />
                          <span>Results</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

