"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface WeekdaySettings {
    startTime: string
    deadlineTime: string
    hasError: boolean
}

interface WeeklyScheduleProps {
    weekdays: number[]
    onToggleWeekday: (day: number) => void
    weekdaySettings: Record<number, WeekdaySettings>
    onUpdateSetting: (day: number, field: keyof WeekdaySettings, value: string) => void
    startDate?: Date
    onStartDateChange: (date: Date | undefined) => void
    endDate?: Date
    onEndDateChange: (date: Date | undefined) => void
    formErrors: Record<string, string | null>
}

export function WeeklySchedule({
                                   weekdays,
                                   onToggleWeekday,
                                   weekdaySettings,
                                   onUpdateSetting,
                                   startDate,
                                   onStartDateChange,
                                   endDate,
                                   onEndDateChange,
                                   formErrors = {},
                               }: WeeklyScheduleProps) {
    // Вспомогательная функция для проверки прошедших дат
    const isPastDate = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    return (
        <>
            {formErrors.weekly && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.weekly}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Days of the Week</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`day-${day}`}
                                    checked={weekdays.includes(day)}
                                    onCheckedChange={() => onToggleWeekday(day)}
                                />
                                <Label htmlFor={`day-${day}`} className="cursor-pointer">
                                    {dayNames[day - 1]}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {weekdays.length > 0 && (
                    <div className="space-y-4 border-t pt-4">
                        <Label>Configure Time for Each Day</Label>
                        <div className="space-y-4">
                            {weekdays.map((day) => (
                                <div key={day} className="p-3 border rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium">{dayNames[day - 1]}</h4>
                                        {weekdaySettings[day]?.hasError && (
                                            <div className="text-sm text-destructive">End time must be after start time</div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Start Time</Label>
                                            <TimePicker
                                                value={weekdaySettings[day]?.startTime || "09:00"}
                                                onChange={(time) => onUpdateSetting(day, "startTime", time)}
                                                className={cn(weekdaySettings[day]?.hasError && "border-destructive")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">End Time</Label>
                                            <TimePicker
                                                value={weekdaySettings[day]?.deadlineTime || "17:00"}
                                                onChange={(time) => onUpdateSetting(day, "deadlineTime", time)}
                                                className={cn(weekdaySettings[day]?.hasError && "border-destructive")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-2">
                        <Label className={cn(formErrors.startDate && "text-destructive")}>
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
                                    {startDate ? format(startDate, "PPP") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={onStartDateChange}
                                    initialFocus
                                    disabled={(date) => isPastDate(date)}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label className={cn(formErrors.endDate && "text-destructive")}>
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
                                    {endDate ? format(endDate, "PPP") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={onEndDateChange}
                                    initialFocus
                                    disabled={(date) => isPastDate(date) || !!(startDate && date < startDate)}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {formErrors.dateRange && <p className="text-sm text-destructive">{formErrors.dateRange}</p>}
            </div>
        </>
    )
}
