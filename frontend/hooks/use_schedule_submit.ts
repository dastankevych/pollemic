"use client"

import type React from "react"

import { useCallback } from "react"
import { addDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface ScheduleSubmitProps {
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
    weekdaySettings: Record<number, WeekdaySettings>
    startDate?: Date
    endDate?: Date
    isFormValid: boolean
    validateForm: () => boolean
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

export function useScheduleSubmit({
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
                                      weekdaySettings,
                                      startDate,
                                      endDate,
                                      isFormValid,
                                      validateForm,
                                  }: ScheduleSubmitProps) {
    const { toast } = useToast()

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()

            // Валидация формы перед отправкой
            validateForm()
            if (!isFormValid) return

            // Логика отправки данных на сервер
            const scheduleData = {
                survey_id: selectedSurvey,
                target_groups: selectedGroups,
                schedule_type: scheduleType,

                // Данные для одноразового расписания
                deadline_date: date?.toISOString(),
                deadline_time: time,
                release_type: releaseType,
                release_date: releaseType === "SCHEDULED" ? releaseDate?.toISOString() : null,
                release_time: releaseType === "SCHEDULED" ? releaseTime : null,

                // Данные для еженедельного расписания
                weekdays: scheduleType === "WEEKLY" ? weekdays.reduce((acc, val) => acc | val, 0) : null,
                weekday_settings: scheduleType === "WEEKLY" ? weekdaySettings : null,

                // Данные для конкретных дат
                specific_dates:
                    scheduleType === "SPECIFIC_DATES"
                        ? specificDates.map((config) => ({
                            start_date: config.startDate.toISOString(),
                            start_time: config.startTime,
                            duration_days: config.durationDays,
                            deadline_time: config.deadlineTime,
                            end_date: addDays(config.startDate, config.durationDays).toISOString(),
                        }))
                        : null,

                start_date: startDate?.toISOString(),
                end_date: endDate?.toISOString(),
            }

            console.log("Submitted data:", scheduleData)

            // Здесь будет API-вызов для сохранения расписания
            // Имитация успешного сохранения
            setTimeout(() => {
                toast({
                    title: "Schedule created",
                    description: "Your survey schedule has been created successfully.",
                })
            }, 1000)
        },
        [
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
            weekdaySettings,
            startDate,
            endDate,
            isFormValid,
            validateForm,
            toast,
        ],
    )

    return { handleSubmit }
}
