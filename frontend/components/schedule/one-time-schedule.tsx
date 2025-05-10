"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface OneTimeScheduleProps {
    date?: Date
    onDateChange: (date: Date | undefined) => void
    time: string
    onTimeChange: (time: string) => void
    releaseType: "IMMEDIATE" | "SCHEDULED"
    onReleaseTypeChange: (type: "IMMEDIATE" | "SCHEDULED") => void
    releaseDate?: Date
    onReleaseDateChange: (date: Date | undefined) => void
    releaseTime: string
    onReleaseTimeChange: (time: string) => void
    formErrors: Record<string, string | null>
}

export function OneTimeSchedule({
                                    date,
                                    onDateChange,
                                    time,
                                    onTimeChange,
                                    releaseType,
                                    onReleaseTypeChange,
                                    releaseDate,
                                    onReleaseDateChange,
                                    releaseTime,
                                    onReleaseTimeChange,
                                    formErrors = {},
                                }: OneTimeScheduleProps) {
    // Вспомогательная функция для проверки прошедших дат
    const isPastDate = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    return (
        <>
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
                                    onSelect={onDateChange}
                                    initialFocus
                                    disabled={(date) => isPastDate(date)}
                                />
                            </PopoverContent>
                        </Popover>

                        <TimePicker
                            value={time}
                            onChange={onTimeChange}
                            className={cn(formErrors.oneTime && "border-destructive")}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Release Settings</Label>
                    <RadioGroup value={releaseType} onValueChange={(value: any) => onReleaseTypeChange(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="IMMEDIATE" id="immediate" />
                            <Label htmlFor="immediate">Release immediately</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="SCHEDULED" id="scheduled" />
                            <Label htmlFor="scheduled">Schedule release</Label>
                        </div>
                    </RadioGroup>
                </div>

                {releaseType === "SCHEDULED" && (
                    <div className="space-y-2 pl-6">
                        <Label>Release Date and Time</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !releaseDate && "text-muted-foreground",
                                            formErrors.releaseDate && "border-destructive",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {releaseDate ? format(releaseDate, "PPP") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={releaseDate}
                                        onSelect={onReleaseDateChange}
                                        initialFocus
                                        disabled={(date) => isPastDate(date)}
                                    />
                                </PopoverContent>
                            </Popover>

                            <TimePicker
                                value={releaseTime}
                                onChange={onReleaseTimeChange}
                                className={cn(formErrors.releaseTime && "border-destructive")}
                            />
                        </div>
                        {formErrors.releaseDateTime && <p className="text-sm text-destructive">{formErrors.releaseDateTime}</p>}
                        {formErrors.releaseBeforeDeadline && (
                            <p className="text-sm text-destructive">{formErrors.releaseBeforeDeadline}</p>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
