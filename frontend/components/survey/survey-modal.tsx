"use client"

import { formatDate } from "@/lib/utils"
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import type { Survey } from "@/services/survey-service"
import { normalizeSurveyQuestions } from "@/lib/survey-utils"

interface SurveyModalProps {
  survey: Survey
  onCloseAction: () => void
}

interface ParsedQuestion {
  id: number
  text: string
  type: "text" | "single_choice" | "multiple_choice"
  options: string[] | null
}

export function SurveyModal({ survey, onCloseAction }: SurveyModalProps) {
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])

  // Parse survey questions from the API format
  useEffect(() => {
    try {
      const normalizedSurvey = normalizeSurveyQuestions(survey);
      setParsedQuestions(normalizedSurvey.questions as ParsedQuestion[]);
    } catch (error) {
      console.error("Error parsing survey questions:", error);
      setParsedQuestions([]);
    }
  }, [survey]);

  // Format date in Telegram style
  const formattedDate = formatDate(survey.created_at)

  return (
    <div className="telegram-chat-style h-full flex flex-col">
      {/* Header in Telegram chat style */}
      <div className="bg-[#5288c1] py-2 px-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={onCloseAction} className="text-white mr-2 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 mr-3">
          <AvatarFallback>P</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-white text-sm">Pollemic</h3>
          <div className="text-xs text-white/80">bot</div>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 bg-[#e5fdd3] p-2 overflow-y-auto">
        <div className="space-y-2 mt-2">
          {/* Date */}
          <div className="flex justify-center mb-2">
            <div className="bg-[#c5e6b2] text-gray-700 rounded-lg px-3 py-1 text-xs">
              {new Date(survey.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </div>
          </div>

          {/* First message - title and description */}
          <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[85%] relative message-bubble shadow-sm">
            <div className="font-medium">{survey.title}</div>
            <p className="text-sm mt-1">{survey.description}</p>
            <div className="text-xs text-gray-500 mt-1 text-right">{formattedDate.time}</div>
          </div>

          {/* Survey privacy message - different for anonymous vs non-anonymous */}
          {survey.is_anonymous ? (
            <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[85%] relative message-bubble shadow-sm">
              <p className="text-sm">
                <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  Anonymous
                </span>
                &nbsp;This survey is anonymous. Your responses will not be linked to your identity.
              </p>
              <div className="text-xs text-gray-500 mt-1 text-right">{formattedDate.time}</div>
            </div>
          ) : (
            <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[85%] relative message-bubble shadow-sm">
              <p className="text-sm">
                <span className="inline-flex items-center rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  Identified
                </span>
                &nbsp;This survey is not anonymous. Your responses will be visible to instructors.
              </p>
              <div className="text-xs text-gray-500 mt-1 text-right">{formattedDate.time}</div>
            </div>
          )}

          {/* Questions as separate messages */}
          {parsedQuestions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white p-3 rounded-lg rounded-tl-none max-w-[85%] relative message-bubble shadow-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="font-medium mb-2">{question.text}</p>

              {/* Display different question types */}
              {question.type === "text" && (
                <div></div>
              )}

              {question.type === "single_choice" && question.options && (
                <RadioGroup defaultValue="">
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2 mb-1 bg-gray-100 rounded p-2">
                      <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                      <Label htmlFor={`${question.id}-${i}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "multiple_choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2 mb-1 bg-gray-100 rounded p-2">
                      <Checkbox id={`${question.id}-${i}`} />
                      <Label htmlFor={`${question.id}-${i}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-1 text-right">{formattedDate.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}