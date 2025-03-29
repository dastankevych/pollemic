"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SurveyList } from "@/components/survey/survey-list"
import { getSurveys, Survey } from "@/services/survey-service"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle } from "lucide-react"

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadSurveys()
  }, [])

  // Filter surveys when search query or survey list changes
  useEffect(() => {
    setFilteredSurveys(
      surveys.filter(survey =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [searchQuery, surveys])

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

  // Handler for successful deletion in the child component
  const handleDeleteSuccess = (deletedId: number) => {
    setSurveys(prev => prev.filter(survey => survey.id !== deletedId))
  }

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

      <SurveyList 
        surveys={filteredSurveys} 
        isLoading={isLoading}
        onDeleteSuccess={handleDeleteSuccess}
      />
      
      {surveys.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">You don't have any surveys yet</p>
          <Link href="/dashboard/surveys/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create your first survey
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}