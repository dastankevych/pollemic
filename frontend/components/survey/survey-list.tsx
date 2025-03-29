// frontend/components/survey/survey-list.tsx
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit, Eye, BarChart, Trash2, Copy, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getSurveys, deleteSurvey } from "@/services/survey-service"

// Define the structure of a survey from the API
interface Survey {
  id: number;
  title: string;
  description: string;
  questions: Record<string, any>;
  is_anonymous: boolean;
  created_at: string;
  created_by: number;
}

export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [surveyToDelete, setSurveyToDelete] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    setIsLoading(true)
    try {
      const data = await getSurveys()
      setSurveys(data)
    } catch (error) {
      console.error("Error loading surveys:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load surveys. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setSurveyToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (surveyToDelete === null) return

    try {
      await deleteSurvey(surveyToDelete)
      setSurveys(surveys.filter(survey => survey.id !== surveyToDelete))
      toast({
        title: "Survey deleted",
        description: "The survey has been successfully deleted.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete survey. Please try again.",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSurveyToDelete(null)
    }
  }

  const handleDuplicateSurvey = (survey: Survey) => {
    // In a real app, we would create a new survey based on this one
    toast({
      title: "Feature coming soon",
      description: "Duplicate functionality will be available soon.",
    })
  }

  const formatDate = (dateString: string) => {
    try {
      // Simple date formatting without external library
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (e) {
      return dateString;
    }
  }

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Surveys" text="Create and manage your surveys.">
        <Link href="/dashboard/surveys/create">
          <Button size="sm" className="h-9">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Survey
          </Button>
        </Link>
      </DashboardHeader>

      <div className="flex items-center justify-between">
        <Input
          placeholder="Search surveys..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isLoading && <p className="text-sm text-muted-foreground">Loading surveys...</p>}
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Title</th>
              <th className="p-4 text-left font-medium">Status</th>
              <th className="p-4 text-left font-medium">Questions</th>
              <th className="p-4 text-left font-medium">Anonymous</th>
              <th className="p-4 text-left font-medium">Created</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSurveys.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-24 text-center">
                  {isLoading ? "Loading surveys..." : "No surveys found."}
                </td>
              </tr>
            ) : (
              filteredSurveys.map((survey) => (
                <tr key={survey.id} className="border-b">
                  <td className="p-4 font-medium">{survey.title}</td>
                  <td className="p-4">
                    <Badge variant="outline">Active</Badge>
                  </td>
                  <td className="p-4">{Object.keys(survey.questions).length}</td>
                  <td className="p-4">{survey.is_anonymous ? "Yes" : "No"}</td>
                  <td className="p-4">{formatDate(survey.created_at)}</td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/surveys/${survey.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/surveys/${survey.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/results/${survey.id}`)}>
                          <BarChart className="mr-2 h-4 w-4" />
                          <span>Results</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicateSurvey(survey)}>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(survey.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the survey and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}