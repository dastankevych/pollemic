"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { OneTimeSchedule } from "@/components/schedule/one-time-schedule"
import { SpecificDatesSchedule } from "@/components/schedule/specific-dates-schedule"
import { WeeklySchedule } from "@/components/schedule/weekly-schedule"
import { SurveyAndGroupsSection } from "@/components/schedule/survey-and-groups-section"
import { useScheduleSubmit } from "@/hooks/use_schedule_submit"
import { useFormValidation } from "@/hooks/use_form_validation"

// Типы данных
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

export function ScheduleForm() {
    // Состояние формы
    const [selectedSurvey, setSelectedSurvey] = useState<string>("")
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])
    const [scheduleType, setScheduleType] = useState<"ONE_TIME" | "SPECIFIC_DATES" | "WEEKLY">("ONE_TIME")

    // Состояние для One-Time расписания
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [time, setTime] = useState<string>("09:00")
    const [releaseType, setReleaseType] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE")
    const [releaseDate, setReleaseDate] = useState<Date | undefined>(undefined)
    const [releaseTime, setReleaseTime] = useState<string>("09:00")

    // Состояние для Specific Dates расписания
    const [specificDates, setSpecificDates] = useState<SpecificDateConfig[]>([])

    // Состояние для Weekly расписания
    const [weekdays, setWeekdays] = useState<number[]>([])
    const [weekdaySettings, setWeekdaySettings] = useState<Record<number, WeekdaySettings>>({
        1: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
        2: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
        3: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
        4: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
        5: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
        6: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
        7: { startTime: "09:00", deadlineTime: "17:00", hasError: false },
    })
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    // Состояние валидации
    const [isValidating, setIsValidating] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string | null>>({})
    const [isFormValid, setIsFormValid] = useState(false)

    // Используем хуки
    const { validateForm, validateSpecificDates, validateWeekdaySettings } = useFormValidation({
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
    })

    const { handleSubmit } = useScheduleSubmit({
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
    })

    // Обработчики для One-Time расписания
    const handleDateChange = (newDate: Date | undefined) => setDate(newDate)
    const handleTimeChange = (newTime: string) => setTime(newTime)
    const handleReleaseTypeChange = (newType: "IMMEDIATE" | "SCHEDULED") => setReleaseType(newType)
    const handleReleaseDateChange = (newDate: Date | undefined) => setReleaseDate(newDate)
    const handleReleaseTimeChange = (newTime: string) => setReleaseTime(newTime)

    // Обработчики для Specific Dates расписания
    const addSpecificDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        setSpecificDates([
            ...specificDates,
            {
                startDate: tomorrow,
                startTime: "09:00",
                durationDays: 0,
                deadlineTime: "17:00",
                hasError: false,
                errorMessage: null,
            },
        ])
    }

    const removeSpecificDate = (index: number) => {
        setSpecificDates((prev) => prev.filter((_, i) => i !== index))
    }

    // Вспомогательные функции
    const isDateTimeInFuture = (date: Date, time: string) => {
        const [hours, minutes] = time.split(":").map(Number)
        const dateTime = new Date(date)
        dateTime.setHours(hours, minutes, 0, 0)
        return dateTime > new Date()
    }

    const isTimeRangeValid = (startTime: string, endTime: string) => {
        const [startHours, startMinutes] = startTime.split(":").map(Number)
        const [endHours, endMinutes] = endTime.split(":").map(Number)

        if (startHours < endHours) return true
        if (startHours === endHours && startMinutes < endMinutes) return true
        return false
    }

    const updateSpecificDateConfig = (index: number, field: keyof SpecificDateConfig, value: any) => {
        setSpecificDates((prev) => {
            const updated = [...prev]
            const config = { ...updated[index], [field]: value }

            // Сбрасываем ошибки изначально
            config.hasError = false
            config.errorMessage = null

            // Валидация, что дата и время в будущем
            if (field === "startDate" || field === "startTime") {
                if (!isDateTimeInFuture(config.startDate, config.startTime)) {
                    config.hasError = true
                    config.errorMessage = "Start date and time must be in the future"
                }
            }

            // Валидация временного диапазона для однодневных расписаний
            if (
                (field === "startTime" || field === "deadlineTime" || field === "durationDays") &&
                config.durationDays === 0
            ) {
                if (!isTimeRangeValid(config.startTime, config.deadlineTime)) {
                    config.hasError = true
                    config.errorMessage = "For same-day schedules, end time must be after start time"
                }
            }

            updated[index] = config
            return updated
        })
    }

    // Обработчики для Weekly расписания
    const toggleWeekday = (day: number) => {
        setWeekdays((prev) => {
            if (prev.includes(day)) {
                return prev.filter((d) => d !== day)
            } else {
                return [...prev, day]
            }
        })
    }

    const updateWeekdaySetting = (day: number, field: keyof WeekdaySettings, value: string) => {
        setWeekdaySettings((prev) => {
            const updated = { ...prev }
            updated[day] = { ...updated[day], [field]: value, hasError: false }

            // Валидация временного диапазона
            if (!isTimeRangeValid(updated[day].startTime, updated[day].deadlineTime)) {
                updated[day].hasError = true
            }

            return updated
        })
    }

    const handleStartDateChange = (newDate: Date | undefined) => setStartDate(newDate)
    const handleEndDateChange = (newDate: Date | undefined) => setEndDate(newDate)

    // Опции для целевых групп
    const targetGroups = [
        { label: "All Students", value: "all" },
        { label: "Computer Science", value: "cs" },
        { label: "First Year Students", value: "first-year" },
        { label: "Engineering", value: "engineering" },
        { label: "Business", value: "business" },
        { label: "Arts & Humanities", value: "arts" },
        { label: "Graduate Students", value: "graduate" },
        { label: "International Students", value: "international" },
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Выбор опроса и групп */}
            <SurveyAndGroupsSection
                selectedSurvey={selectedSurvey}
                setSelectedSurvey={setSelectedSurvey}
                selectedGroups={selectedGroups}
                setSelectedGroups={setSelectedGroups}
                targetGroups={targetGroups}
                formErrors={formErrors}
            />

            {/* Карточка планирования */}
            <Card>
                <CardHeader>
                    <CardTitle>Scheduling</CardTitle>
                    <CardDescription>Configure when the survey will be sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Вкладки типов расписания */}
                    <Tabs
                        defaultValue="ONE_TIME"
                        value={scheduleType}
                        onValueChange={(value: any) => setScheduleType(value)}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="ONE_TIME">One-time</TabsTrigger>
                            <TabsTrigger value="SPECIFIC_DATES">Specific Dates</TabsTrigger>
                            <TabsTrigger value="WEEKLY">Weekly Schedule</TabsTrigger>
                        </TabsList>

                        {/* Содержимое вкладки One-time */}
                        <TabsContent value="ONE_TIME" className="space-y-6 mt-4">
                            <OneTimeSchedule
                                date={date}
                                onDateChange={handleDateChange}
                                time={time}
                                onTimeChange={handleTimeChange}
                                releaseType={releaseType}
                                onReleaseTypeChange={handleReleaseTypeChange}
                                releaseDate={releaseDate}
                                onReleaseDateChange={handleReleaseDateChange}
                                releaseTime={releaseTime}
                                onReleaseTimeChange={handleReleaseTimeChange}
                                formErrors={formErrors}
                            />
                        </TabsContent>

                        {/* Содержимое вкладки Specific Dates */}
                        <TabsContent value="SPECIFIC_DATES" className="space-y-6 mt-4">
                            <SpecificDatesSchedule
                                specificDates={specificDates}
                                onAddDate={addSpecificDate}
                                onRemoveDate={removeSpecificDate}
                                onUpdateConfig={updateSpecificDateConfig}
                                formErrors={formErrors}
                            />
                        </TabsContent>

                        {/* Содержимое вкладки Weekly */}
                        <TabsContent value="WEEKLY" className="space-y-6 mt-4">
                            <WeeklySchedule
                                weekdays={weekdays}
                                onToggleWeekday={toggleWeekday}
                                weekdaySettings={weekdaySettings}
                                onUpdateSetting={updateWeekdaySetting}
                                startDate={startDate}
                                onStartDateChange={handleStartDateChange}
                                endDate={endDate}
                                onEndDateChange={handleEndDateChange}
                                formErrors={formErrors}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="ml-auto">
                                    <Button type="submit" disabled={!isFormValid}>
                                        Save Schedule
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!isFormValid && (
                                <TooltipContent>
                                    <p>
                                        {formErrors.emptySchedule ||
                                            formErrors.oneTime ||
                                            formErrors.specificDates ||
                                            formErrors.weekly ||
                                            formErrors.startDate ||
                                            formErrors.endDate ||
                                            "Please fix validation errors before submitting. The schedule configuration is invalid."}
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </CardFooter>
            </Card>
        </form>
    )
}
