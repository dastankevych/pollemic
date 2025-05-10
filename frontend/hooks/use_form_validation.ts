"use client"

import { useCallback, useEffect } from "react"

interface FormValidationProps {
  selectedSurvey: string
  selectedGroups: string[]
  scheduleType: "ONE_TIME" | "SPECIFIC_DATES" | "WEEKLY"
  date?: Date
  time: string
  releaseType: "IMMEDIATE" | "SCHEDULED"
  releaseDate?: Date
  releaseTime: string
  specificDates: SpecificDateConfig[]
  weekdays: number[]
  startDate?: Date
  endDate?: Date
  weekdaySettings: Record<number, WeekdaySettings>
  setFormErrors: (errors: Record<string, string | null>) => void
  setIsFormValid: (isValid: boolean) => void
  isValidating: boolean
}

interface SpecificDateConfig {
  startDate: Date
  startTime: string
  durationDays: number
  deadlineTime: string
  hasError: boolean
  errorMessage: string | null
}

interface WeekdaySettings {
  startTime: string
  deadlineTime: string
  hasError: boolean
}

export function useFormValidation({
                                    selectedSurvey,
                                    selectedGroups,
                                    scheduleType,
                                    date,
                                    time,
                                    releaseType,
                                    releaseDate,
                                    releaseTime,
                                    specificDates,
                                    weekdays,
                                    startDate,
                                    endDate,
                                    weekdaySettings,
                                    setFormErrors,
                                    setIsFormValid,
                                    isValidating,
                                  }: FormValidationProps) {
  // Вспомогательные функции
  const isDateTimeInFuture = (date?: Date, time?: string): boolean => {
    if (!date || !time) return false

    const [hours, minutes] = time.split(":").map(Number)
    const dateTime = new Date(date)
    dateTime.setHours(hours, minutes, 0, 0)
    return dateTime > new Date()
  }

  const isTimeRangeValid = (startTime: string, endTime: string): boolean => {
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    const [endHours, endMinutes] = endTime.split(":").map(Number)

    if (startHours < endHours) return true
    if (startHours === endHours && startMinutes < endMinutes) return true
    return false
  }

  // Валидация конкретных дат
  const validateSpecificDates = useCallback(() => {
    if (scheduleType !== "SPECIFIC_DATES" || specificDates.length === 0) {
      return true
    }

    return !specificDates.some((config) => config.hasError)
  }, [scheduleType, specificDates])

  // Валидация настроек дней недели
  const validateWeekdaySettings = useCallback(() => {
    if (scheduleType !== "WEEKLY" || weekdays.length === 0) {
      return true
    }

    return !weekdays.some((day) => weekdaySettings[day].hasError)
  }, [scheduleType, weekdays, weekdaySettings])

  // Основная функция валидации формы
  const validateForm = useCallback(() => {
    const errors: Record<string, string | null> = {}

    // Валидация выбора опроса
    if (!selectedSurvey) {
      errors.survey = "Please select a survey"
    }

    // Валидация выбора групп
    if (selectedGroups.length === 0) {
      errors.groups = "Please select at least one target group"
    }

    // Валидация в зависимости от типа расписания
    if (scheduleType === "ONE_TIME") {
      // Валидация даты и времени
      if (!date) {
        errors.oneTime = "Please select a date"
      } else if (!time) {
        errors.oneTime = "Please select a time"
      } else if (!isDateTimeInFuture(date, time)) {
        errors.oneTime = "Date and time must be in the future"
      }

      // Валидация запланированного выпуска
      if (releaseType === "SCHEDULED") {
        if (!releaseDate) {
          errors.releaseDate = "Please select a release date"
        } else if (!releaseTime) {
          errors.releaseTime = "Please select a release time"
        } else if (!isDateTimeInFuture(releaseDate, releaseTime)) {
          errors.releaseDateTime = "Release date and time must be in the future"
        }

        // Проверка, что дата выпуска раньше даты дедлайна
        if (date && releaseDate && time && releaseTime) {
          const deadlineDateTime = new Date(date)
          const [deadlineHours, deadlineMinutes] = time.split(":").map(Number)
          deadlineDateTime.setHours(deadlineHours, deadlineMinutes, 0, 0)

          const releaseDateTime = new Date(releaseDate)
          const [releaseHours, releaseMinutes] = releaseTime.split(":").map(Number)
          releaseDateTime.setHours(releaseHours, releaseMinutes, 0, 0)

          if (releaseDateTime >= deadlineDateTime) {
            errors.releaseBeforeDeadline = "Release date and time must be before deadline"
          }
        }
      }
    } else if (scheduleType === "SPECIFIC_DATES") {
      // Валидация конкретных дат
      if (specificDates.length === 0) {
        errors.specificDates = "Please add at least one specific date"
      } else if (!validateSpecificDates()) {
        errors.specificDates = "Please fix errors in specific dates"
      }
    } else if (scheduleType === "WEEKLY") {
      // Валидация еженедельного расписания
      if (weekdays.length === 0) {
        errors.weekly = "Please select at least one day of the week"
      } else if (!validateWeekdaySettings()) {
        errors.weekly = "Please fix errors in weekday settings"
      }

      // Валидация дат начала и окончания
      if (!startDate) {
        errors.startDate = "Please select a start date"
      }

      if (!endDate) {
        errors.endDate = "Please select an end date"
      }

      if (startDate && endDate && startDate >= endDate) {
        errors.dateRange = "End date must be after start date"
      }
    }

    // Проверка, что расписание не пустое
    const isScheduleEmpty =
        (scheduleType === "ONE_TIME" && (!date || !time)) ||
        (scheduleType === "SPECIFIC_DATES" && specificDates.length === 0) ||
        (scheduleType === "WEEKLY" && (weekdays.length === 0 || !startDate || !endDate))

    if (isScheduleEmpty) {
      errors.emptySchedule = "Cannot submit an empty schedule"
    }

    setFormErrors(errors)
    setIsFormValid(Object.keys(errors).length === 0)

    return Object.keys(errors).length === 0
  }, [
    selectedSurvey,
    selectedGroups,
    scheduleType,
    date,
    time,
    releaseType,
    releaseDate,
    releaseTime,
    specificDates,
    weekdays,
    startDate,
    endDate,
    validateSpecificDates,
    validateWeekdaySettings,
    setFormErrors,
    setIsFormValid,
  ])

  // Запуск валидации при изменении зависимостей
  useEffect(() => {
    if (!isValidating) {
      validateForm()
    }
  }, [
    selectedSurvey,
    selectedGroups,
    scheduleType,
    date,
    time,
    releaseType,
    releaseDate,
    releaseTime,
    specificDates,
    weekdays,
    startDate,
    endDate,
    validateForm,
    isValidating,
  ])

  return {
    validateForm,
    validateSpecificDates,
    validateWeekdaySettings,
  }
}
