"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SurveyBuilder } from "@/components/survey/survey-builder"

export default function CreateSurveyPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const surveyBuilderRef = useRef<any>(null)

  const handleSaveSurvey = async () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Missing title",
        description: "Please provide a title for your survey.",
      })
      return
    }

    if (!surveyBuilderRef.current) return
    const surveyData = surveyBuilderRef.current.getSurveyData()

    if (surveyData.questions.length === 0) {
      toast({
        variant: "destructive",
        title: "No questions",
        description: "Please add at least one question to your survey.",
      })
      return
    }

    setIsLoading(true)

    try {
      // In a real app, this would be an API call to save the survey
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Survey created",
        description: "Your survey has been created successfully.",
      })

      router.push("/dashboard/surveys")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create survey",
        description: "There was an error creating your survey. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Create Survey" text="Design a new survey with custom questions.">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSaveSurvey} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Survey"}
          </Button>
        </div>
      </DashboardHeader>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title</Label>
              <Input
                id="title"
                placeholder="Enter survey title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter survey description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SurveyBuilder
        ref={surveyBuilderRef}
        initialTitle={title}
        initialDescription={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />
    </div>
  )
}

