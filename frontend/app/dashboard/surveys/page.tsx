"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreVertical, ChevronRight } from "lucide-react"
import Link from "next/link"
import { SurveyModal } from "@/components/survey/survey-modal"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Survey } from "@/services/survey-service"
import "./styles.css"

// Моковые данные для опросников
const surveys: Survey[] = [
  {
    id: 1,
    title: "Опрос о предпочтениях пользователей",
    description: "Узнайте, что думают пользователи о вашем продукте",
    questions: [
      {
        id: 1,
        text: "Как часто вы пользуетесь нашим сервисом?",
        type: "text",
        options: null,
      },
      {
        id: 2,
        text: "Что вам больше всего нравится в нашем продукте?",
        type: "single",
        options: ["Интерфейс", "Функциональность", "Скорость работы", "Поддержка"],
      },
      {
        id: 3,
        text: "Выберите функции, которые вы хотели бы видеть в будущем:",
        type: "multiple",
        options: ["Тёмная тема", "Мобильное приложение", "Интеграция с другими сервисами", "Офлайн-режим"],
      },
    ],
    is_anonymous: false,
    created_at: "2023-05-15T10:30:00Z",
    created_by: 1,
    status: true, // Теперь это boolean
  },
  {
    id: 2,
    title: "Оценка качества обслуживания",
    description: "Помогите нам стать лучше, оценив наш сервис",
    questions: [
      {
        id: 1,
        text: "Насколько вы удовлетворены скоростью обслуживания?",
        type: "single",
        options: ["Очень доволен", "Доволен", "Нейтрально", "Недоволен", "Очень недоволен"],
      },
      {
        id: 2,
        text: "Оцените компетентность наших сотрудников",
        type: "single",
        options: ["Отлично", "Хорошо", "Удовлетворительно", "Плохо", "Очень плохо"],
      },
      {
        id: 3,
        text: "Какие аспекты обслуживания нуждаются в улучшении?",
        type: "multiple",
        options: ["Скорость", "Вежливость", "Компетентность", "Доступность", "Качество решения проблем"],
      },
    ],
    is_anonymous: true,
    created_at: "2023-06-20T14:45:00Z",
    created_by: 2,
    status: false, // Теперь это boolean
  },
  {
    id: 3,
    title: "Исследование рынка",
    description: "Помогите нам понять тенденции рынка",
    questions: [
      {
        id: 1,
        text: "Какие факторы влияют на ваше решение о покупке?",
        type: "text",
        options: null,
      },
      {
        id: 2,
        text: "Какие бренды вы предпочитаете?",
        type: "multiple",
        options: ["Apple", "Samsung", "Google", "Microsoft", "Sony", "Другое"],
      },
      {
        id: 3,
        text: "Как часто вы совершаете покупки онлайн?",
        type: "single",
        options: ["Ежедневно", "Еженедельно", "Ежемесячно", "Раз в квартал", "Раз в год", "Никогда"],
      },
    ],
    is_anonymous: false,
    created_at: "2023-07-05T09:15:00Z",
    created_by: 3,
    status: true, // Теперь это boolean
  },
]


export default function SurveysPage() {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openSurveyModal = (survey: Survey) => {
    setSelectedSurvey(survey)
    setIsModalOpen(true)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Опросники</h1>
        <Link href="/dashboard/surveys/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Создать опросник
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Левая колонка с опросниками (занимает 8 из 12 колонок) */}
        <div className="col-span-8 space-y-4">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="survey-item-wrapper"
              onClick={() => openSurveyModal(survey as Survey)}
            >
              <div className="survey-item bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center cursor-pointer border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{survey.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{survey.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge
                    variant={survey.status ? "success" : "destructive"}
                    className="mx-4"
                  >
                    {(survey as Survey).status}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      openSurveyModal(survey as Survey)
                    }}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Язычок со стрелкой */}
              <div className="tab-indicator">
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Правая колонка (занимает 4 из 12 колонок) - можно использовать для дополнительной информации */}
        <div className="col-span-4">{/* Здесь можно добавить дополнительную информацию или функциональность */}</div>
      </div>

      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="p-0 w-[400px] sm:max-w-full telegram-chat-container">
          {/* Скрываем кнопку закрытия */}
          <style jsx global>{`
            .telegram-chat-container [data-state=open].bg-secondary {
              display: none;
            }
          `}</style>
          {selectedSurvey && <SurveyModal survey={selectedSurvey} onCloseAction={() => setIsModalOpen(false)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

