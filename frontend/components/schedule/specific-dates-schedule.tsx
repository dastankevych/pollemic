"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2, Info } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SpecificDateConfig {
    startDate: Date
    startTime: string
    durationDays: number
    deadlineTime: string
    hasError: boolean
    errorMessage: string | null
}

interface SpecificDatesScheduleProps {
    specificDates: SpecificDateConfig[]
    onAddDate: () => void
    onRemoveDate: (index: number) => void
    onUpdateConfig: (index: number, field: keyof SpecificDateConfig, value: any) => void
    formErrors: Record<string, string | null>
}

export function SpecificDatesSchedule({
                                          specificDates,
                                          onAddDate,
                                          onRemoveDate,
                                          onUpdateConfig,
                                          formErrors = {},
                                      }: SpecificDatesScheduleProps) {
    // Вспомогательная функция для проверки прошедших дат
    const isPastDate = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    return (
        <>
            {formErrors.specificDates && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.specificDates}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>Specific Dates</Label>
                    <Button type="button" variant="outline" size="sm" onClick={onAddDate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Date
                    </Button>
                </div>

                {specificDates.length === 0 ? (
                    <div className="text-center p-4 border rounded-md border-dashed">
                        <p className="text-muted-foreground">No dates added. Click "Add Date" to start.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px] rounded-md border">
                        <div className="p-4 space-y-6">
                            {specificDates.map((config, index) => (
                                <div key={index} className="space-y-3 pb-4 border-b last:border-0">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium">Date {index + 1}</h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onRemoveDate(index)}
                                            className="h-8 w-8"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {config.hasError && config.errorMessage && (
                                        <div className="text-sm text-destructive flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {config.errorMessage}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Start Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            config.hasError && "border-destructive",
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {format(config.startDate, "PPP")}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={config.startDate}
                                                        onSelect={(date) => date && onUpdateConfig(index, "startDate", date)}
                                                        initialFocus
                                                        disabled={(date) => isPastDate(date)}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">Start Time</Label>
                                            <TimePicker
                                                value={config.startTime}
                                                onChange={(time) => onUpdateConfig(index, "startTime", time)}
                                                className={cn(config.hasError && "border-destructive")}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <Label className="text-xs">Duration (days)</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs">
                                                                0 = Same day (ends on the same day)
                                                                <br />1 = Next day (ends the following day)
                                                                <br />
                                                                etc.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={config.durationDays}
                                                onChange={(e) => onUpdateConfig(index, "durationDays", Number.parseInt(e.target.value) || 0)}
                                                className={cn(config.hasError && "border-destructive")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">End Time</Label>
                                            <TimePicker
                                                value={config.deadlineTime}
                                                onChange={(time) => onUpdateConfig(index, "deadlineTime", time)}
                                                className={cn(config.hasError && "border-destructive")}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        End date: {format(addDays(config.startDate, config.durationDays), "PPP")} at {config.deadlineTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </>
    )
}
