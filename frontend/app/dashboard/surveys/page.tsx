"use client"

import { useState } from "react"
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
import type { Survey } from "@/services/survey-service"
import "./styles.css"

// Mock data for surveys
const surveys: Survey[] = [
  {
    id: 1,
    title: "User Preferences Survey",
    description: "Find out what users think about your product",
    questions: [
      {
        id: 1,
        text: "How often do you use our service?",
        type: "text",
        options: null,
      },
      {
        id: 2,
        text: "What do you like most about our product?",
        type: "single",
        options: ["Interface", "Functionality", "Speed", "Support"],
      },
      {
        id: 3,
        text: "Select features you would like to see in the future:",
        type: "multiple",
        options: ["Dark theme", "Mobile app", "Integration with other services", "Offline mode"],
      },
    ],
    is_anonymous: false,
    created_at: "2023-05-15T10:30:00Z",
    created_by: 1,
    status: true,
  },
  {
    id: 2,
    title: "Service Quality Assessment",
    description: "Help us improve by rating our service",
    questions: [
      {
        id: 1,
        text: "How satisfied are you with our service speed?",
        type: "single",
        options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
      },
      {
        id: 2,
        text: "Rate the competence of our staff",
        type: "single",
        options: ["Excellent", "Good", "Satisfactory", "Poor", "Very poor"],
      },
      {
        id: 3,
        text: "Which aspects of our service need improvement?",
        type: "multiple",
        options: ["Speed", "Politeness", "Competence", "Accessibility", "Problem solving quality"],
      },
    ],
    is_anonymous: true,
    created_at: "2023-06-20T14:45:00Z",
    created_by: 2,
    status: false,
  },
  {
    id: 3,
    title: "Market Research",
    description: "Help us understand market trends",
    questions: [
      {
        id: 1,
        text: "What factors influence your purchase decision?",
        type: "text",
        options: null,
      },
      {
        id: 2,
        text: "Which brands do you prefer?",
        type: "multiple",
        options: ["Apple", "Samsung", "Google", "Microsoft", "Sony", "Other"],
      },
      {
        id: 3,
        text: "How often do you shop online?",
        type: "single",
        options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Never"],
      },
    ],
    is_anonymous: false,
    created_at: "2023-07-05T09:15:00Z",
    created_by: 3,
    status: true,
  },
]

export default function SurveysPage() {
  const router = useRouter()
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [surveyToDelete, setSurveyToDelete] = useState<number | null>(null)

  const openSurveyModal = (survey: Survey) => {
    setSelectedSurvey(survey)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setSurveyToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (surveyToDelete === null) return

    // Имитация удаления опроса
    console.log(`Deleting survey with ID: ${surveyToDelete}`)

    // Закрываем диалог
    setDeleteDialogOpen(false)
    setSurveyToDelete(null)
  }

  const handleDuplicateSurvey = (survey: Survey) => {
    // Имитация дублирования опроса
    console.log(`Duplicating survey: ${survey.title}`)
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

          <div className="space-y-2">
            {surveys.map((survey) => (
              <div key={survey.id} className="survey-item-wrapper" onClick={() => openSurveyModal(survey as Survey)}>
                <div className="survey-item bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center cursor-pointer border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{survey.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{survey.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      variant={survey.status ? "success" : "destructive"}
                      className={survey.status ? "badge-success" : "badge-inactive"}
                    >
                      {survey.status ? "Active" : "Inactive"}
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
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateSurvey(survey)
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(survey.id)
                          }}
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
            ))}
          </div>
        </div>

        {/* Right column (takes 4 out of 12 columns) - can be used for additional information */}
        <div className="col-span-4">{/* Here you can add additional information or functionality */}</div>
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

