"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, ChevronRight, Eye, Edit, BarChart, Copy, Trash2 } from "lucide-react"
import Link from "next/link"
import { SurveyModal } from "@/components/survey/survey-modal"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getSurveys, deleteSurvey, Survey } from "@/services/survey-service"
import { useToast } from "@/hooks/use-toast"
import "./styles.css"

export default function SurveysPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [surveyToDelete, setSurveyToDelete] = useState<number | null>(null)

  // Fetch surveys on component mount
  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    setIsLoading(true)
    try {
      const data = await getSurveys()
      setSurveys(data)
    } catch (error) {
      console.error("Error fetching surveys:", error)
      toast({
        variant: "destructive",
        title: "Failed to load surveys",
        description: "Could not load surveys. Please try again later."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openSurveyModal = (survey: Survey) => {
    setSelectedSurvey(survey)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening the survey modal
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
        description: "The survey has been successfully deleted."
      })

      setDeleteDialogOpen(false)
      setSurveyToDelete(null)

      // If the deleted survey is currently displayed in the modal, close it
      if (selectedSurvey && selectedSurvey.id === surveyToDelete) {
        setIsModalOpen(false)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete the survey. Please try again."
      })
    }
  }

  const handleDuplicateSurvey = (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening the survey modal
    router.push(`/dashboard/surveys/create?duplicate=${survey.id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (e) {
      return "Unknown date"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-4">
        {/* Left column with surveys (takes 8 out of 12 columns) */}
        <div className="col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Surveys</h1>
            <Link href="/dashboard/surveys/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Survey
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground">Loading surveys...</p>
              </div>
            </div>
          ) : surveys.length === 0 ? (
            <div className="border border-dashed rounded-lg p-10 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">No surveys found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                You haven't created any surveys yet. Get started by creating your first survey.
              </p>
              <div className="pt-2">
                <Link href="/dashboard/surveys/create">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create your first survey
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {surveys.map((survey) => {
                // Count questions (handling both array and object formats)
                const questionCount = Array.isArray(survey.questions)
                  ? survey.questions.length
                  : Object.keys(survey.questions).length;

                return (
                  <div key={survey.id} className="survey-item-wrapper" onClick={() => openSurveyModal(survey)}>
                    <div className="survey-item bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center cursor-pointer border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{survey.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="text-xs text-gray-400">
                            Created: {formatDate(survey.created_at)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Questions: {questionCount}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge
                          variant={true ? "default" : "secondary"}
                          className={true ? "badge-success" : "badge-inactive"}
                        >
                          {true ? "Active" : "Inactive"}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/surveys/${survey.id}`)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/surveys/${survey.id}/edit`)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/results/${survey.id}`)
                              }}
                            >
                              <BarChart className="mr-2 h-4 w-4" />
                              <span>Results</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDuplicateSurvey(survey, e)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(survey.id, e)}
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Tab with arrow */}
                    <div className="tab-indicator">
                      <ChevronRight className="h-6 w-6 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column (takes 4 out of 12 columns) - can be used for additional information */}
        <div className="col-span-4">
          {/* Information about surveys or recent activity could go here */}
        </div>
      </div>

      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="p-0 w-[400px] sm:max-w-full telegram-chat-container">
          {/* Hide close button and customize overlay */}
          <style jsx global>{`
            .telegram-chat-container [data-state=open].bg-secondary {
              display: none;
            }
          `}</style>
          {selectedSurvey && <SurveyModal survey={selectedSurvey} onCloseAction={() => setIsModalOpen(false)} />}
        </SheetContent>
      </Sheet>

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
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}