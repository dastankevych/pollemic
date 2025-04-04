// frontend/components/survey/survey-submission.tsx
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { SurveyBuilder } from "@/components/survey/survey-builder"
import { createSurvey, Question, Survey } from "@/services/survey-service"
import { normalizeSurveyQuestions } from "@/lib/survey-utils"

// Mock user ID - in a real app, this would come from authentication
const CURRENT_USER_ID = 123456789;

export default function SurveyCreationForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
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

    if (!surveyData.questions || surveyData.questions.length === 0) {
      toast({
        variant: "destructive",
        title: "No questions",
        description: "Please add at least one question to your survey.",
      })
      return
    }

    setIsLoading(true)

    try {
      // First normalize survey questions to ensure we have an array
      const normalizedSurvey = normalizeSurveyQuestions({
        ...surveyData,
        id: 0, // Temporary ID
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
        created_by: CURRENT_USER_ID
      });

      // Now questions is guaranteed to be an array
      const questions = (normalizedSurvey.questions as Question[]).map((q: Question) => {
        return {
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.type !== "text" ? q.options : null
        };
      });

      // Create request payload according to backend model
      const requestData = {
        title: surveyData.title,
        description: surveyData.description,
        questions: questions,
        is_anonymous: isAnonymous,
        created_by: CURRENT_USER_ID
      };

      // Use the survey service to create the survey
      const result = await createSurvey(requestData);

      toast({
        title: "Survey created",
        description: `Survey "${title}" has been created successfully.`,
      });

      // Navigate back to surveys list
      router.push("/dashboard/surveys");
    } catch (error) {
      console.error("Error creating survey:", error);

      toast({
        variant: "destructive",
        title: "Failed to create survey",
        description: error instanceof Error ? error.message : "There was an error creating your survey. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous">Anonymous Survey</Label>
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