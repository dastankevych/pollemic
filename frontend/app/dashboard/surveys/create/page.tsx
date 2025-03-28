"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { SurveyQuestionBuilder } from "@/components/survey/survey-question-builder"
import { SurveyPreview } from "@/components/survey/survey-preview"

export default function CreateSurveyPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAddQuestion = (question: any) => {
    setQuestions([...questions, question])
  }

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions]
    newQuestions.splice(index, 1)
    setQuestions(newQuestions)
  }

  const handleSaveSurvey = async () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Missing title",
        description: "Please provide a title for your survey.",
      })
      return
    }

    if (questions.length === 0) {
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

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Question Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="builder" className="space-y-4">
          <SurveyQuestionBuilder
            onAddQuestion={handleAddQuestion}
            questions={questions}
            onRemoveQuestion={handleRemoveQuestion}
          />
        </TabsContent>
        <TabsContent value="preview">
          <SurveyPreview title={title} description={description} questions={questions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

