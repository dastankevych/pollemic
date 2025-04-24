"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScheduleList } from "@/components/dashboard/schedule-list"
import { Input } from "@/components/ui/input"
import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns"
import { CalendarIcon, Trash2, AlertCircle, Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimePicker } from "@/components/ui/time-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Переопределяем интерфейсы с более явной типизацией
interface WeekdayConfig {
  time: string
  duration: number
  endTime: string
  hasError: boolean // Делаем обязательным
  errorMessage: string | null // Используем null вместо undefined
}

interface WeekdaySettings {
  [key: number]: WeekdayConfig
}

// Interface for specific date configuration
interface SpecificDateConfig {
  startDate: Date
  startTime: string
  durationDays: number
  deadlineTime: string
  hasError: boolean // Делаем обязательным
  errorMessage: string | null // Используем null вместо undefined
}

// Available target groups
const targetGroups: Option[] = [
  { label: "All Students", value: "all" },
  { label: "Computer Science", value: "cs" },
  { label: "First Year Students", value: "first-year" },
  { label: "Engineering", value: "engineering" },
  { label: "Business", value: "business" },
  { label: "Arts & Humanities", value: "arts" },
  { label: "Graduate Students", value: "graduate" },
  { label: "International Students", value: "international" },
]

export default function SchedulePage() {
  // Ref для отслеживания первоначальной загрузки
  const initialRender = useRef(true)

  // Добавим новый ref для отслеживания изменений в specificDates
  const prevSpecificDatesRef = useRef<SpecificDateConfig[]>([])

  const [selectedSurvey, setSelectedSurvey] = useState<string>("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [scheduleType, setScheduleType] = useState<string>("ONE_TIME")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>("09:00")
  const [releaseType, setReleaseType] = useState<string>("NOW")
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(new Date())
  const [releaseTime, setReleaseTime] = useState<string>("09:00")
  const [weekdays, setWeekdays] = useState<number[]>([]) // No weekdays selected by default
  const [weekdaySettings, setWeekdaySettings] = useState<WeekdaySettings>({
    1: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
    2: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
    4: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
    8: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
    16: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
    32: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
    64: { time: "09:00", duration: 0, endTime: "18:00", hasError: false, errorMessage: null },
  })

  // State for specific dates with configuration
  const [specificDates, setSpecificDates] = useState<SpecificDateConfig[]>([
    {
      startDate: new Date(2025, 3, 18), // April 18th, 2025
      startTime: "09:00",
      durationDays: 3,
      deadlineTime: "23:59",
      hasError: false,
      errorMessage: null,
    },
  ])
  const [tempDate, setTempDate] = useState<Date | undefined>(new Date())

  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2025, 3, 18))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(2025, 3, 18))

  // Validation states
  const [formErrors, setFormErrors] = useState<{
    survey?: string
    groups?: string
    oneTime?: string
    specificDates?: string
    weekly?: string
    startDate?: string
    endDate?: string
    emptySchedule?: string
  }>({})

  const [isFormValid, setIsFormValid] = useState(false)

  // Флаг для предотвращения циклических обновлений
  const [isValidating, setIsValidating] = useState(false)

  const weekdayMap = {
    1: "Monday",
    2: "Tuesday",
    4: "Wednesday",
    8: "Thursday",
    16: "Friday",
    32: "Saturday",
    64: "Sunday",
  }

  // Get current date and time for validation
  const now = new Date()

  // Helper function to convert time string to Date object
  const timeStringToDate = (dateObj: Date, timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const result = new Date(dateObj)
    result.setHours(hours, minutes, 0, 0)
    return result
  }

  // Validate if a date is in the future
  const isDateInFuture = (dateObj?: Date): boolean => {
    if (!dateObj) return false
    return isAfter(dateObj, now)
  }

  // Validate if a date with time is in the future
  const isDateTimeInFuture = (dateObj?: Date, timeStr?: string): boolean => {
    if (!dateObj || !timeStr) return false
    const dateTime = timeStringToDate(dateObj, timeStr)
    return isAfter(dateTime, now)
  }

  // Validate time range for same-day schedules
  const isTimeRangeValid = (startTime: string, endTime: string): boolean => {
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    const [endHours, endMinutes] = endTime.split(":").map(Number)

    if (startHours < endHours) return true
    if (startHours === endHours && startMinutes < endMinutes) return true
    return false
  }

  // Проверка конкретных дат без изменения состояния
  const validateSpecificDates = useCallback(() => {
    if (scheduleType !== "SPECIFIC_DATES" || specificDates.length === 0) {
      return { hasErrors: false, errorMessage: "" }
    }

    let hasErrors = false
    let errorMessage = ""

    // Проверяем каждую дату без изменения состояния
    for (const config of specificDates) {
      // Проверка, что дата и время в будущем
      if (!isDateTimeInFuture(config.startDate, config.startTime)) {
        hasErrors = true
        errorMessage = "One or more dates have start times in the past"
        break
      }

      // Проверка диапазона времени для однодневных расписаний
      if (config.durationDays === 0 && !isTimeRangeValid(config.startTime, config.deadlineTime)) {
        hasErrors = true
        errorMessage = "For same-day schedules, end time must be after start time"
        break
      }
    }

    return { hasErrors, errorMessage }
  }, [scheduleType, specificDates])

  // Проверка настроек дней недели без изменения состояния
  const validateWeekdaySettings = useCallback(() => {
    if (scheduleType !== "WEEKLY" || weekdays.length === 0) {
      return { hasErrors: false, errorMessage: "" }
    }

    let hasErrors = false
    let errorMessage = ""

    // Проверяем каждый день недели без изменения состояния
    for (const day of weekdays) {
      const settings = weekdaySettings[day]

      // Проверка диапазона времени для однодневных расписаний
      if (settings.duration === 0 && !isTimeRangeValid(settings.time, settings.endTime)) {
        hasErrors = true
        errorMessage = "For same-day schedules, end time must be after start time"
        break
      }
    }

    return { hasErrors, errorMessage }
  }, [scheduleType, weekdays, weekdaySettings])

  // Validate the entire form
  const validateForm = useCallback(() => {
    if (isValidating) return

    const errors: any = {}

    // Validate survey selection
    if (!selectedSurvey) {
      errors.survey = "Please select a survey"
    }

    // Validate group selection
    if (selectedGroups.length === 0) {
      errors.groups = "Please select at least one target group"
    }

    // Validate based on schedule type
    if (scheduleType === "ONE_TIME") {
      // Validate deadline date and time
      if (!date) {
        errors.oneTime = "Please select a deadline date"
      } else if (!isDateTimeInFuture(date, time)) {
        errors.oneTime = "Deadline must be in the future"
      }

      // Validate release date and time if scheduled
      if (releaseType === "SCHEDULED") {
        if (!releaseDate) {
          errors.oneTime = "Please select a release date"
        } else if (!isDateTimeInFuture(releaseDate, releaseTime)) {
          errors.oneTime = "Release date and time must be in the future"
        } else if (
          date && 
          releaseDate && 
          isAfter(timeStringToDate(releaseDate, releaseTime), timeStringToDate(date, time))
        ) {
          errors.oneTime = "Release date and time must be before deadline"
        }
      }
    } else if (scheduleType === "SPECIFIC_DATES") {
      // Check if there are any specific dates
      if (specificDates.length === 0) {
        errors.specificDates = "Please add at least one specific date"
      } else {
        // Validate specific dates
        const { hasErrors, errorMessage } = validateSpecificDates()
        if (hasErrors) {
          errors.specificDates = errorMessage
        }
      }
    } else if (scheduleType === "WEEKLY") {
      // Check if any weekdays are selected
      if (weekdays.length === 0) {
        errors.weekly = "Please select at least one day of the week"
      } else {
        // Validate weekday settings
        const { hasErrors, errorMessage } = validateWeekdaySettings()
        if (hasErrors) {
          errors.weekly = errorMessage
        }
      }

      // Validate start and end dates
      if (!startDate) {
        errors.startDate = "Please select a start date"
      } else if (!isDateInFuture(startDate)) {
        errors.startDate = "Start date must be in the future"
      }

      if (!endDate) {
        errors.endDate = "Please select an end date"
      } else if (startDate && endDate && isBefore(endDate, startDate)) {
        errors.endDate = "End date must be on or after the start date"
      }
    }

    // Check if the schedule is empty
    const isScheduleEmpty = (
      (scheduleType === "ONE_TIME" && (!date || !time)) ||
      (scheduleType === "SPECIFIC_DATES" && specificDates.length === 0) ||
      (scheduleType === "WEEKLY" && (weekdays.length === 0 || !startDate || !endDate))
    )
    
    if (isScheduleEmpty) {
      errors.emptySchedule = "Cannot submit an empty schedule"
    }

    setFormErrors(errors)
    setIsFormValid(Object.keys(errors).length === 0)
  }, [
    isValidating,
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
  ])

  // Изменим функцию updateSpecificDateErrors, чтобы избежать зацикливания
  const updateSpecificDateErrors = useCallback(() => {
    if (scheduleType !== "SPECIFIC_DATES" || specificDates.length === 0 || isValidating) {
      return
    }

    // Проверяем, действительно ли нужно обновлять состояние
    let needsUpdate = false
    const updatedDates = specificDates.map((config, index) => {
      // Создаем новый объект с сброшенными ошибками
      const newConfig = { ...config, hasError: false, errorMessage: "" }

      // Проверка, что дата и время в будущем
      if (!isDateTimeInFuture(config.startDate, config.startTime)) {
        newConfig.hasError = true
        newConfig.errorMessage = "Start date and time must be in the future"
        needsUpdate = true
      }
      // Проверка диапазона времени для однодневных расписаний
      else if (config.durationDays === 0 && !isTimeRangeValid(config.startTime, config.deadlineTime)) {
        newConfig.hasError = true
        newConfig.errorMessage = "For same-day schedules, end time must be after start time"
        needsUpdate = true
      }

      // Проверяем, изменилось ли что-то в этой конфигурации
      const prevConfig = prevSpecificDatesRef.current[index]
      if (
        prevConfig &&
        prevConfig.hasError === newConfig.hasError &&
        prevConfig.errorMessage === newConfig.errorMessage
      ) {
        return config // Возвращаем исходную конфигурацию, если ничего не изменилось
      }

      return newConfig
    })

    // Обновляем состояние только если что-то изменилось
    if (needsUpdate) {
      setIsValidating(true)
      prevSpecificDatesRef.current = updatedDates
      setSpecificDates(updatedDates)

      // Используем setTimeout, чтобы избежать зацикливания
      setTimeout(() => {
        setIsValidating(false)
      }, 0)
    }
  }, [scheduleType, specificDates])

  // Обновление ошибок для дней недели
  const updateWeekdayErrors = useCallback(() => {
    if (scheduleType !== "WEEKLY" || weekdays.length === 0 || isValidating) {
      return
    }

    setIsValidating(true)

    const updatedSettings = { ...weekdaySettings }
    let needsUpdate = false

    weekdays.forEach((day) => {
      const currentSettings = updatedSettings[day]
      const hasErrorBefore = currentSettings.hasError
      const errorMessageBefore = currentSettings.errorMessage

      // Сбрасываем ошибки
      updatedSettings[day] = {
        ...currentSettings,
        hasError: false,
        errorMessage: null,
      }

      // Проверка диапазона времени для однодневных расписаний
      if (
        updatedSettings[day].duration === 0 &&
        !isTimeRangeValid(updatedSettings[day].time, updatedSettings[day].endTime)
      ) {
        updatedSettings[day].hasError = true
        updatedSettings[day].errorMessage = "For same-day schedules, end time must be after start time"
      }

      // Проверяем, изменилось ли что-то
      if (hasErrorBefore !== updatedSettings[day].hasError || 
          errorMessageBefore !== updatedSettings[day].errorMessage) {
        needsUpdate = true
      }
    })

    if (needsUpdate) {
      setWeekdaySettings(updatedSettings)
    }
    
    setIsValidating(false)
  }, [scheduleType, weekdays, weekdaySettings])

  // Эффект для основной валидации формы
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }

    const timer = setTimeout(() => {
      validateForm()
    }, 100)

    return () => clearTimeout(timer)
  }, [
    validateForm,
    selectedSurvey,
    selectedGroups,
    scheduleType,
    date,
    time,
    releaseType,
    releaseDate,
    releaseTime,
    weekdays,
    startDate,
    endDate,
  ])

  // Изменим эффект для обновления ошибок конкретных дат
  useEffect(() => {
    if (initialRender.current) return

    // Сохраняем текущее состояние для сравнения
    prevSpecificDatesRef.current = specificDates

    // Используем debounce для предотвращения частых вызовов
    const timer = setTimeout(() => {
      if (scheduleType === "SPECIFIC_DATES" && !isValidating) {
        updateSpecificDateErrors()
      }
    }, 300) // Увеличиваем задержку до 300мс

    return () => clearTimeout(timer)
  }, [scheduleType, specificDates, updateSpecificDateErrors, isValidating])

  // Эффект для обновления ошибок дней недели
  useEffect(() => {
    if (initialRender.current) return

    const timer = setTimeout(() => {
      if (scheduleType === "WEEKLY" && !isValidating) {
        updateWeekdayErrors()
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [scheduleType, weekdays, weekdaySettings, updateWeekdayErrors, isValidating])

  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((d) => d !== day))
    } else {
      setWeekdays([...weekdays, day])
    }
  }

  const updateWeekdaySetting = (day: number, field: keyof WeekdayConfig, value: string | number) => {
    setWeekdaySettings((prev) => {
      const updatedSettings = { ...prev }
      const currentSettings = { ...updatedSettings[day], [field]: value }
      
      // Сбрасываем ошибки изначально
      currentSettings.hasError = false
      currentSettings.errorMessage = null
      
      // Validate time range for same-day schedules
      if (currentSettings.duration === 0) {
        if (!isTimeRangeValid(currentSettings.time, currentSettings.endTime)) {
          currentSettings.hasError = true
          currentSettings.errorMessage = "For same-day schedules, end time must be after start time"
        }
      }
      
      updatedSettings[day] = currentSettings
      return updatedSettings
    })
  }

  // Filter past dates for calendar
  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(now))
  }

  // Add a specific date with default configuration
  const addSpecificDate = () => {
    if (!tempDate) return

    // Check if date already exists
    const exists = specificDates.some((config) => config.startDate.toDateString() === tempDate.toDateString())

    if (!exists) {
      // Validate that the date is in the future
      if (isBefore(tempDate, startOfDay(now))) {
        // Don't add past dates
        return
      }

      setSpecificDates((prev) => [
        ...prev,
        {
          startDate: tempDate,
          startTime: "09:00",
          durationDays: 3,
          deadlineTime: "23:59",
          hasError: false,
          errorMessage: null,
        },
      ])
    }
  }

  // Remove a specific date
  const removeSpecificDate = (index: number) => {
    setSpecificDates((prev) => prev.filter((_, i) => i !== index))
  }

  // Изменим функцию updateSpecificDateConfig для более правильной валидации в момент изменения
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
      if ((field === "startTime" || field === "deadlineTime" || field === "durationDays") && 
          config.durationDays === 0) {
        if (!isTimeRangeValid(config.startTime, config.deadlineTime)) {
          config.hasError = true
          config.errorMessage = "For same-day schedules, end time must be after start time"
        }
      }
      
      updated[index] = config
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    validateForm()
    if (!isFormValid) return

    // Logic for sending data to the server
    const scheduleData = {
      survey_id: selectedSurvey,
      target_groups: selectedGroups, // Now an array of group IDs
      schedule_type: scheduleType,

      // One-time schedule data
      deadline_date: date?.toISOString(),
      deadline_time: time,
      release_type: releaseType,
      release_date: releaseType === "SCHEDULED" ? releaseDate?.toISOString() : null,
      release_time: releaseType === "SCHEDULED" ? releaseTime : null,

      // Weekly schedule data
      weekdays: scheduleType === "WEEKLY" ? weekdays.reduce((acc, val) => acc | val, 0) : null,
      weekday_settings: scheduleType === "WEEKLY" ? weekdaySettings : null,

      // Specific dates schedule data
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
    // API call to save the schedule would go here
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Schedule Surveys" text="Plan and schedule your surveys for automatic distribution." />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Survey and Group Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Survey and Groups</CardTitle>
            <CardDescription>Choose a survey and target groups</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="survey" className={cn(formErrors.survey && "text-destructive")}>
                Survey {formErrors.survey && <span className="text-xs">- {formErrors.survey}</span>}
              </Label>
              <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                <SelectTrigger id="survey" className={cn(formErrors.survey && "border-destructive")}>
                  <SelectValue placeholder="Select a survey" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Course Feedback</SelectItem>
                  <SelectItem value="2">Teaching Evaluation</SelectItem>
                  <SelectItem value="3">Student Satisfaction</SelectItem>
                  <SelectItem value="4">Learning Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groups" className={cn(formErrors.groups && "text-destructive")}>
                Target Groups {formErrors.groups && <span className="text-xs">- {formErrors.groups}</span>}
              </Label>
              <MultiSelect
                options={targetGroups}
                selected={selectedGroups}
                onChange={setSelectedGroups}
                placeholder="Select target groups"
                className={cn(formErrors.groups && "border-destructive")}
              />
              {selectedGroups.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedGroups.length} group{selectedGroups.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduling</CardTitle>
            <CardDescription>Configure when the survey will be sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Schedule Type Tabs */}
            <Tabs defaultValue="ONE_TIME" value={scheduleType} onValueChange={setScheduleType} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ONE_TIME">One-time</TabsTrigger>
                <TabsTrigger value="SPECIFIC_DATES">Specific Dates</TabsTrigger>
                <TabsTrigger value="WEEKLY">Weekly Schedule</TabsTrigger>
              </TabsList>

              {/* One-time Schedule Content */}
              <TabsContent value="ONE_TIME" className="space-y-6 mt-4">
                {formErrors.oneTime && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.oneTime}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Deadline Date and Time</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground",
                              formErrors.oneTime && "border-destructive",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(date) => isPastDate(date)}
                          />
                        </PopoverContent>
                      </Popover>

                      <TimePicker
                        value={time}
                        onChange={setTime}
                        className={cn(formErrors.oneTime && "border-destructive")}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This is when the survey will close and no more responses will be accepted.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>Release Options</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={releaseType === "NOW" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => setReleaseType("NOW")}
                      >
                        Assign immediately
                      </Button>
                      <Button
                        type="button"
                        variant={releaseType === "SCHEDULED" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => setReleaseType("SCHEDULED")}
                      >
                        Deferred assignment
                      </Button>
                    </div>

                    {releaseType === "SCHEDULED" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !releaseDate && "text-muted-foreground",
                                formErrors.oneTime && "border-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {releaseDate ? format(releaseDate, "PPP") : "Select release date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={releaseDate}
                              onSelect={setReleaseDate}
                              initialFocus
                              disabled={(date) => isPastDate(date)}
                            />
                          </PopoverContent>
                        </Popover>

                        <TimePicker
                          value={releaseTime}
                          onChange={setReleaseTime}
                          className={cn(formErrors.oneTime && "border-destructive")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Specific Dates Schedule Content */}
              <TabsContent value="SPECIFIC_DATES" className="space-y-6 mt-4">
                {formErrors.specificDates && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.specificDates}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Select Dates</h3>
                    <Calendar
                      mode="single"
                      selected={tempDate}
                      onSelect={setTempDate}
                      className="rounded-md border"
                      disabled={(date) => isPastDate(date)}
                    />
                    <Button
                      type="button"
                      onClick={addSpecificDate}
                      className="w-full mt-2"
                      disabled={
                        !tempDate ||
                        specificDates.some((config) => config.startDate.toDateString() === tempDate?.toDateString()) ||
                        (tempDate && isPastDate(tempDate))
                      }
                    >
                      Add Selected Date
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Configured Dates ({specificDates.length})</h3>
                    {specificDates.length === 0 ? (
                      <div className="text-center p-4 border rounded-md text-muted-foreground">
                        No dates selected. Select dates from the calendar and add them.
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] border rounded-md">
                        <div className="p-4 space-y-6">
                          {specificDates.map((config, index) => (
                            <div
                              key={index}
                              className={cn("border rounded-md p-4 relative", config.hasError && "border-destructive")}
                            >
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-base font-semibold">{format(config.startDate, "MMMM do, yyyy")}</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSpecificDate(index)}
                                  className="absolute top-2 right-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {config.hasError && config.errorMessage && (
                                <Alert variant="destructive" className="mb-4">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>{config.errorMessage}</AlertDescription>
                                </Alert>
                              )}

                              <div className="space-y-4">
                                <div>
                                  <Label className="block mb-2">Start Time</Label>
                                  <TimePicker
                                    value={config.startTime}
                                    onChange={(value) => updateSpecificDateConfig(index, "startTime", value)}
                                    className={cn(
                                      config.hasError && 
                                      (config.errorMessage?.includes("future") || config.errorMessage?.includes("start time")) && 
                                      "border-destructive"
                                    )}
                                  />
                                  {config.hasError && config.errorMessage?.includes("future") && (
                                    <p className="text-xs text-destructive mt-1">
                                      <AlertCircle className="h-3 w-3 inline mr-1" />
                                      {config.errorMessage}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <Label className="block mb-2">Duration (days)</Label>
                                  <div className="flex items-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={config.durationDays}
                                      onChange={(e) => {
                                        const value = Number.parseInt(e.target.value)
                                        if (!isNaN(value) && value >= 0) {
                                          updateSpecificDateConfig(index, "durationDays", value)
                                        }
                                      }}
                                      className="w-full"
                                    />
                                    <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap">
                                      +{config.durationDays} days
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Ends on: {format(addDays(config.startDate, config.durationDays), "MMMM do, yyyy")}
                                  </p>
                                </div>

                                <div>
                                  <Label className="block mb-2">Deadline Time</Label>
                                  <TimePicker
                                    value={config.deadlineTime}
                                    onChange={(value) => updateSpecificDateConfig(index, "deadlineTime", value)}
                                    className={cn(
                                      config.hasError &&
                                      config.errorMessage?.includes("end time") &&
                                      "border-destructive"
                                    )}
                                  />
                                  {config.durationDays === 0 && (
                                    <p className={cn(
                                      "text-xs mt-1", 
                                      config.hasError && config.errorMessage?.includes("end time") ? 
                                        "text-destructive" : "text-muted-foreground"
                                    )}>
                                      <Info className="h-3 w-3 inline mr-1" />
                                      For same-day schedules, deadline time must be after start time
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Weekly Schedule Content */}
              <TabsContent value="WEEKLY" className="space-y-6 mt-4">
                {formErrors.weekly && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.weekly}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Select days of the week</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(weekdayMap).map(([dayValue, dayName]) => {
                        const day = Number.parseInt(dayValue)
                        const isSelected = weekdays.includes(day)
                        const hasError = weekdaySettings[day].hasError
                        return (
                          <div key={day} className="flex flex-col items-center gap-2">
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={cn("w-full", isSelected ? "bg-primary text-primary-foreground" : "")}
                              onClick={() => toggleWeekday(day)}
                            >
                              {dayName.substring(0, 3)}
                            </Button>

                            {isSelected && (
                              <div className="space-y-2 w-full">
                                {hasError && weekdaySettings[day].errorMessage && (
                                  <Alert variant="destructive" className="mb-2 py-2 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    <AlertDescription className="text-xs">
                                      {weekdaySettings[day].errorMessage}
                                    </AlertDescription>
                                  </Alert>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor={`time-${day}`} className={cn(
                                      "text-xs",
                                      weekdaySettings[day].hasError && "text-destructive"
                                    )}>
                                      Start Time
                                    </Label>
                                    <TimePicker
                                      value={weekdaySettings[day].time}
                                      onChange={(value) => updateWeekdaySetting(day, "time", value)}
                                      className={cn(hasError && "border-destructive")}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`end-time-${day}`} className={cn(
                                      "text-xs",
                                      weekdaySettings[day].hasError && "text-destructive"
                                    )}>
                                      End Time
                                    </Label>
                                    <TimePicker
                                      value={weekdaySettings[day].endTime}
                                      onChange={(value) => updateWeekdaySetting(day, "endTime", value)}
                                      className={cn(hasError && "border-destructive")}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1">
                                  <div>
                                    <Label htmlFor={`duration-${day}`} className="text-xs">
                                      Duration (days)
                                    </Label>
                                    <div className="flex items-center">
                                      <Input
                                        id={`duration-${day}`}
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={weekdaySettings[day].duration}
                                        onChange={(e) =>
                                          updateWeekdaySetting(day, "duration", Number.parseInt(e.target.value) || 0)
                                        }
                                        className="w-full"
                                      />
                                      <div className="text-xs text-muted-foreground ml-2">
                                        {weekdaySettings[day].duration === 0
                                          ? "Same day"
                                          : weekdaySettings[day].duration === 1
                                            ? "Next day"
                                            : `+${weekdaySettings[day].duration} days`}
                                      </div>
                                    </div>
                                    {weekdaySettings[day].duration === 0 && (
                                      <p className={cn(
                                        "text-xs mt-1", 
                                        weekdaySettings[day].hasError ? "text-destructive" : "text-muted-foreground"
                                      )}>
                                        <Info className="h-3 w-3 inline mr-1" />
                                        For same-day schedules, end time must be after start time
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Schedule Period</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="start-date"
                          className={cn("text-sm", formErrors.startDate && "text-destructive")}
                        >
                          Start Date {formErrors.startDate && <span className="text-xs">- {formErrors.startDate}</span>}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground",
                                formErrors.startDate && "border-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "MMMM do, yyyy") : "Select a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              disabled={(date) => isPastDate(date)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end-date" className={cn("text-sm", formErrors.endDate && "text-destructive")}>
                          End Date {formErrors.endDate && <span className="text-xs">- {formErrors.endDate}</span>}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground",
                                formErrors.endDate && "border-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "MMMM do, yyyy") : "Select a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              disabled={(date) => {
                                // Disable past dates and dates before start date
                                if (isPastDate(date)) return true
                                if (startDate && isBefore(date, startDate)) return true
                                return false
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Surveys</CardTitle>
          <CardDescription>List of all scheduled surveys</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleList />
        </CardContent>
      </Card>
    </div>
  )
}