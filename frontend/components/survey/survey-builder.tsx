"use client"

import React from "react"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, GripVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Question {
  id: number
  text: string
  type: "text" | "radio" | "checkbox"
  options: Option[]
}

interface Option {
  id: number
  text: string
}

interface SurveyBuilderProps {
  initialTitle?: string
  initialDescription?: string
  onTitleChange?: (title: string) => void
  onDescriptionChange?: (description: string) => void
}

export const SurveyBuilder = forwardRef<any, SurveyBuilderProps>((props, ref) => {
  const { initialTitle = "", initialDescription = "", onTitleChange, onDescriptionChange } = props

  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [optionCount, setOptionCount] = useState(0)
  const [draggedQuestionId, setDraggedQuestionId] = useState<number | null>(null)
  const [draggedOptionInfo, setDraggedOptionInfo] = useState<{ questionId: number; optionId: number } | null>(null)
  const [dropQuestionIndex, setDropQuestionIndex] = useState<number | null>(null)
  const [dropOptionIndex, setDropOptionIndex] = useState<{ questionId: number; index: number } | null>(null)
  const questionsContainerRef = useRef<HTMLDivElement>(null)
  const optionsContainerRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  useEffect(() => {
    setDescription(initialDescription)
  }, [initialDescription])

  // Обработчики изменения заголовка и описания
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (onTitleChange) {
      onTitleChange(newTitle)
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
    if (onDescriptionChange) {
      onDescriptionChange(newDescription)
    }
  }

  // Экспортируем методы для родительского компонента
  useImperativeHandle(ref, () => ({
    getSurveyData: () => ({
      title,
      description,
      questions: questions.map((q) => ({
        ...q,
        options: q.options.map((o) => o.text),
      })),
    }),
  }))

  // Добавляем первый вопрос при загрузке
  useEffect(() => {
    if (questions.length === 0) {
      addQuestion()
    }
  }, [])

  const addQuestion = () => {
    const newId = questionCount
    setQuestionCount((prev) => prev + 1)

    const newQuestion: Question = {
      id: newId,
      text: "",
      type: "text",
      options: [],
    }

    setQuestions((prev) => [...prev, newQuestion])
  }

  const updateQuestionText = (id: number, text: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)))
  }

  const updateQuestionType = (id: number, type: "text" | "radio" | "checkbox") => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          // Если тип изменился на radio или checkbox и нет опций, добавляем две опции по умолчанию
          let options = q.options
          if ((type === "radio" || type === "checkbox") && q.options.length === 0) {
            const opt1Id = optionCount
            const opt2Id = optionCount + 1
            setOptionCount((prev) => prev + 2)
            options = [
              { id: opt1Id, text: "Вариант 1" },
              { id: opt2Id, text: "Вариант 2" },
            ]
          }
          return { ...q, type, options }
        }
        return q
      }),
    )
  }

  const addOption = (questionId: number) => {
    const newId = optionCount
    setOptionCount((prev) => prev + 1)

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [...q.options, { id: newId, text: `Новый вариант` }],
          }
        }
        return q
      }),
    )
  }

  const updateOptionText = (questionId: number, optionId: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
          }
        }
        return q
      }),
    )
  }

  const deleteOption = (questionId: number, optionId: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter((o) => o.id !== optionId),
          }
        }
        return q
      }),
    )
  }

  const deleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  // Обработчики для drag-and-drop вопросов
  const handleQuestionDragStart = (e: React.DragEvent, questionId: number) => {
    setDraggedQuestionId(questionId)
    e.currentTarget.classList.add("opacity-50")
  }

  const handleQuestionDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50")
    setDraggedQuestionId(null)
    setDropQuestionIndex(null)
  }

  const handleQuestionDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedQuestionId === null) return

    const container = questionsContainerRef.current
    if (!container) return

    const questionElements = Array.from(container.querySelectorAll(".question-item"))
    const dragIndex = questions.findIndex((q) => q.id === draggedQuestionId)

    // Находим индекс, куда будет вставлен элемент
    let dropIndex = questionElements.findIndex((el) => {
      const rect = el.getBoundingClientRect()
      return e.clientY < rect.top + rect.height / 2
    })

    // Корректируем индекс, если перетаскиваемый элемент находится выше целевого
    if (dropIndex === -1) {
      dropIndex = questions.length
    } else if (dragIndex < dropIndex) {
      dropIndex--
    }

    // Не обновляем, если индекс не изменился
    if (dropIndex === dragIndex) {
      setDropQuestionIndex(null)
    } else {
      setDropQuestionIndex(dropIndex)
    }
  }

  const handleQuestionDragDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedQuestionId === null || dropQuestionIndex === null) return

    const dragIndex = questions.findIndex((q) => q.id === draggedQuestionId)
    if (dragIndex === -1) return

    // Создаем новый массив вопросов с обновленным порядком
    const newQuestions = [...questions]
    const [draggedQuestion] = newQuestions.splice(dragIndex, 1)
    newQuestions.splice(dropQuestionIndex, 0, draggedQuestion)

    setQuestions(newQuestions)
    setDropQuestionIndex(null)
  }

  // Обработчики для drag-and-drop опций
  const handleOptionDragStart = (e: React.DragEvent, questionId: number, optionId: number) => {
    setDraggedOptionInfo({ questionId, optionId })
    e.currentTarget.classList.add("opacity-50")
    // Предотвращаем всплытие события, чтобы не активировать drag-and-drop вопросов
    e.stopPropagation()
  }

  const handleOptionDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50")
    setDraggedOptionInfo(null)
    setDropOptionIndex(null)
    e.stopPropagation()
  }

  const handleOptionDragOver = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedOptionInfo === null || draggedOptionInfo.questionId !== questionId) return

    const optionsContainer = optionsContainerRefs.current[questionId]
    if (!optionsContainer) return

    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    const optionElements = Array.from(optionsContainer.querySelectorAll(".option-item"))
    const dragIndex = question.options.findIndex((o) => o.id === draggedOptionInfo.optionId)

    // Находим индекс, куда будет вставлен элемент
    let dropIndex = optionElements.findIndex((el) => {
      const rect = el.getBoundingClientRect()
      return e.clientY < rect.top + rect.height / 2
    })

    // Корректируем индекс, если перетаскиваемый элемент находится выше целевого
    if (dropIndex === -1) {
      dropIndex = question.options.length
    } else if (dragIndex < dropIndex) {
      dropIndex--
    }

    // Не обновляем, если индекс не изменился
    if (dropIndex === dragIndex) {
      setDropOptionIndex(null)
    } else {
      setDropOptionIndex({ questionId, index: dropIndex })
    }
  }

  const handleOptionDragDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedOptionInfo === null || !dropOptionIndex || dropOptionIndex.questionId !== questionId) return

    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    const dragIndex = question.options.findIndex((o) => o.id === draggedOptionInfo.optionId)
    if (dragIndex === -1) return

    // Создаем новый массив опций с обновленным порядком
    const newOptions = [...question.options]
    const [draggedOption] = newOptions.splice(dragIndex, 1)
    newOptions.splice(dropOptionIndex.index, 0, draggedOption)

    // Обновляем состояние с новым порядком опций
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, options: newOptions } : q)))

    setDropOptionIndex(null)
  }

  // Функция для сохранения ссылки на контейнер опций
  const setOptionsContainerRef = (questionId: number, ref: HTMLDivElement | null) => {
    optionsContainerRefs.current[questionId] = ref
  }

  // Функция для определения, нужно ли показывать индикатор вставки для вопроса
  const shouldShowQuestionDropIndicator = (index: number) => {
    return dropQuestionIndex === index && draggedQuestionId !== null
  }

  // Функция для определения, нужно ли показывать индикатор вставки для опции
  const shouldShowOptionDropIndicator = (questionId: number, index: number) => {
    return dropOptionIndex?.questionId === questionId && dropOptionIndex?.index === index && draggedOptionInfo !== null
  }

  return (
    <div
      ref={questionsContainerRef}
      className="space-y-4"
      onDragOver={handleQuestionDragOver}
      onDrop={handleQuestionDragDrop}
    >
      {shouldShowQuestionDropIndicator(0) && <div className="drop-indicator h-2 bg-primary/20 rounded-full my-2" />}

      {questions.map((question, qIndex) => (
        <React.Fragment key={question.id}>
          <div
            className={cn(
              "question-item bg-card border rounded-md p-6",
              draggedQuestionId === question.id ? "dragging" : "",
            )}
            data-id={question.id}
            draggable
            onDragStart={(e) => handleQuestionDragStart(e, question.id)}
            onDragEnd={handleQuestionDragEnd}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="cursor-move text-muted-foreground">
                <GripVertical size={20} />
              </div>
              <Input
                className="flex-1 text-lg font-medium border-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/50"
                placeholder="Текст вопроса"
                value={question.text}
                onChange={(e) => updateQuestionText(question.id, e.target.value)}
              />
              <Select
                value={question.type}
                onValueChange={(value: "text" | "radio" | "checkbox") => updateQuestionType(question.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Тип вопроса" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="radio">Один вариант</SelectItem>
                  <SelectItem value="checkbox">Несколько вариантов</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteQuestion(question.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={18} />
              </Button>
            </div>

            {(question.type === "radio" || question.type === "checkbox") && (
              <>
                <div
                  ref={(ref) => setOptionsContainerRef(question.id, ref)}
                  className="pl-8 space-y-2 options-container"
                  onDragOver={(e) => handleOptionDragOver(e, question.id)}
                  onDrop={(e) => handleOptionDragDrop(e, question.id)}
                >
                  {shouldShowOptionDropIndicator(question.id, 0) && (
                    <div className="drop-indicator h-1 bg-primary/20 rounded-full my-1" />
                  )}

                  {question.options.map((option, oIndex) => (
                    <React.Fragment key={option.id}>
                      <div
                        className={cn(
                          "option-item flex items-center gap-2",
                          draggedOptionInfo?.optionId === option.id && draggedOptionInfo?.questionId === question.id
                            ? "dragging"
                            : "",
                        )}
                        data-question-id={question.id}
                        data-option-id={option.id}
                        draggable
                        onDragStart={(e) => handleOptionDragStart(e, question.id, option.id)}
                        onDragEnd={handleOptionDragEnd}
                      >
                        <div className="cursor-move text-muted-foreground">
                          <GripVertical size={16} />
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center">
                          {question.type === "radio" ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary" />
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-primary" />
                          )}
                        </div>
                        <Input
                          className="flex-1 border-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/50"
                          placeholder="Вариант ответа"
                          value={option.text}
                          onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteOption(question.id, option.id)}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={question.options.length <= 2}
                        >
                          <X size={16} />
                        </Button>
                      </div>

                      {shouldShowOptionDropIndicator(question.id, oIndex + 1) && (
                        <div className="drop-indicator h-1 bg-primary/20 rounded-full my-1" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="pl-8 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => addOption(question.id)} className="text-primary">
                    <PlusCircle size={16} className="mr-2" />
                    Добавить вариант
                  </Button>
                </div>
              </>
            )}
          </div>

          {shouldShowQuestionDropIndicator(qIndex + 1) && (
            <div className="drop-indicator h-2 bg-primary/20 rounded-full my-2" />
          )}
        </React.Fragment>
      ))}

      <Button variant="outline" onClick={addQuestion} className="w-full py-6">
        <PlusCircle size={18} className="mr-2" />
        Добавить вопрос
      </Button>
    </div>
  )
})

SurveyBuilder.displayName = "SurveyBuilder"

