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
import { createSurvey, CreateSurveyRequest, Question } from "@/services/survey-service"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"

export default function CreateSurveyPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const surveyBuilderRef = useRef<any>(null)

  const handleSaveSurvey = async () => {
    // Валидация данных формы
    if (!title.trim()) {
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
      // Трансформация вопросов из формата билдера в формат API
      const questions: Question[] = surveyData.questions.map((q: any) => ({
        text: q.text,
        type: mapQuestionTypeToApi(q.type),
        options: Array.isArray(q.options) ? q.options : null
      }));

      // Подготовка данных запроса
      const requestData: CreateSurveyRequest = {
        title,
        description,
        questions,
        is_anonymous: isAnonymous,
        created_by: getUserId() // В реальном приложении это должно приходить из системы аутентификации
      };

      // Вызов API для создания опроса
      const response = await createSurvey(requestData);

      toast({
        title: "Survey created",
        description: "Your survey has been created successfully.",
      })

      // Переход на страницу со списком опросов после успешного создания
      router.push("/dashboard/surveys")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create survey",
        description: error.message || "There was an error creating your survey. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Вспомогательная функция для преобразования типов вопросов из UI в API формат
  const mapQuestionTypeToApi = (uiType: string): string => {
    switch (uiType) {
      case 'text': return 'text';
      case 'radio': return 'single_choice';
      case 'checkbox': return 'multiple_choice';
      default: return uiType;
    }
  }

  // Получаем ID пользователя из контекста аутентификации
  const getUserId = (): number => {
    if (!user) {
      console.error("User is not authenticated");
      return 0; // Return a default value or handle this case appropriately
    }
    return user.user_id;
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
            <div className="flex items-center space-x-2">
              <Switch
                id="is-anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="is-anonymous">Anonymous Survey</Label>
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