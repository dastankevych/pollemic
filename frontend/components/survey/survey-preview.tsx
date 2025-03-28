"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface SurveyPreviewProps {
  title: string
  description: string
  questions: any[]
}

export function SurveyPreview({ title, description, questions }: SurveyPreviewProps) {
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Add questions to preview your survey
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Survey Preview"}</CardTitle>
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="space-y-2">
            <Label className="text-base font-medium">
              {index + 1}. {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {question.type === "multiple-choice" && (
              <RadioGroup defaultValue="">
                {question.options.map((option: string, optIndex: number) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`q${index}-opt${optIndex}`} />
                    <Label htmlFor={`q${index}-opt${optIndex}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "checkbox" && (
              <div className="space-y-2">
                {question.options.map((option: string, optIndex: number) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <Checkbox id={`q${index}-opt${optIndex}`} />
                    <Label htmlFor={`q${index}-opt${optIndex}`}>{option}</Label>
                  </div>
                ))}
              </div>
            )}

            {question.type === "likert" && (
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <RadioGroupItem value="1" id={`q${index}-opt1`} />
                  <Label htmlFor={`q${index}-opt1`} className="text-xs mt-1">
                    Strongly Disagree
                  </Label>
                </div>
                <div className="flex flex-col items-center">
                  <RadioGroupItem value="2" id={`q${index}-opt2`} />
                  <Label htmlFor={`q${index}-opt2`} className="text-xs mt-1">
                    Disagree
                  </Label>
                </div>
                <div className="flex flex-col items-center">
                  <RadioGroupItem value="3" id={`q${index}-opt3`} />
                  <Label htmlFor={`q${index}-opt3`} className="text-xs mt-1">
                    Neutral
                  </Label>
                </div>
                <div className="flex flex-col items-center">
                  <RadioGroupItem value="4" id={`q${index}-opt4`} />
                  <Label htmlFor={`q${index}-opt4`} className="text-xs mt-1">
                    Agree
                  </Label>
                </div>
                <div className="flex flex-col items-center">
                  <RadioGroupItem value="5" id={`q${index}-opt5`} />
                  <Label htmlFor={`q${index}-opt5`} className="text-xs mt-1">
                    Strongly Agree
                  </Label>
                </div>
              </div>
            )}

            {question.type === "text" && <Textarea placeholder="Enter your answer here" />}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full">Submit Survey</Button>
      </CardFooter>
    </Card>
  )
}

