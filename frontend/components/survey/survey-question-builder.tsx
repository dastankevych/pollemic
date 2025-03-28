"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash, GripVertical } from "lucide-react"

interface SurveyQuestionBuilderProps {
  questions: any[]
  onAddQuestion: (question: any) => void
  onRemoveQuestion: (index: number) => void
}

export function SurveyQuestionBuilder({ questions, onAddQuestion, onRemoveQuestion }: SurveyQuestionBuilderProps) {
  const [questionType, setQuestionType] = useState("multiple-choice")
  const [questionText, setQuestionText] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [required, setRequired] = useState(true)

  const handleAddOption = () => {
    setOptions([...options, ""])
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options]
    newOptions.splice(index, 1)
    setOptions(newOptions)
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleAddQuestion = () => {
    if (!questionText) return

    const newQuestion = {
      type: questionType,
      text: questionText,
      required,
      options: questionType !== "text" ? options.filter((option) => option) : [],
    }

    onAddQuestion(newQuestion)
    setQuestionText("")
    setOptions(["", ""])
    setRequired(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-type">Question Type</Label>
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger id="question-type">
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="checkbox">Checkbox (Multiple Answers)</SelectItem>
                <SelectItem value="likert">Likert Scale</SelectItem>
                <SelectItem value="text">Text Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              placeholder="Enter your question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />
          </div>

          {(questionType === "multiple-choice" || questionType === "checkbox") && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove option</span>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAddOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {questionType === "likert" && (
            <div className="space-y-2">
              <Label>Scale Options</Label>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div>Strongly Disagree</div>
                <div>Disagree</div>
                <div>Neutral</div>
                <div>Agree</div>
                <div>Strongly Agree</div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="required">Required question</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddQuestion} disabled={!questionText}>
            Add Question
          </Button>
        </CardFooter>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Survey Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">
                      {index + 1}. {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Type: {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                    </p>
                    {(question.type === "multiple-choice" || question.type === "checkbox") && (
                      <div className="mt-2 space-y-1">
                        {question.options.map((option: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveQuestion(index)}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Remove question</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

