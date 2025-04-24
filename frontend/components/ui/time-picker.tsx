"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TimePickerProps {
  value: string // in 24h format "HH:MM"
  onChange: (time: string) => void // callback returns time in 24h format "HH:MM"
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Parse the 24h time value
  const [hours24, minutes] = value.split(":").map(Number)

  // Convert to 12h format
  const hours12 = hours24 % 12 || 12
  const period = hours24 >= 12 ? "PM" : "AM"

  // State for the picker
  const [selectedHour, setSelectedHour] = React.useState(hours12)
  const [selectedMinute, setSelectedMinute] = React.useState(minutes)
  const [selectedPeriod, setSelectedPeriod] = React.useState<"AM" | "PM">(period as "AM" | "PM")
  const [activeTab, setActiveTab] = React.useState<"hour" | "minute">("hour")

  // This ref prevents the initial render from triggering an update
  const isInitialRender = React.useRef(true)

  // Update internal state when external value changes
  React.useEffect(() => {
    const [newHours24, newMinutes] = value.split(":").map(Number)
    const newHours12 = newHours24 % 12 || 12
    const newPeriod = newHours24 >= 12 ? "PM" : "AM"

    setSelectedHour(newHours12)
    setSelectedMinute(newMinutes)
    setSelectedPeriod(newPeriod as "AM" | "PM")
  }, [value])

  // Handle time changes and call onChange only when user interaction occurs
  const handleTimeChange = React.useCallback(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    // Convert back to 24h format
    let hours24 = selectedHour
    if (selectedPeriod === "PM" && selectedHour < 12) {
      hours24 = selectedHour + 12
    } else if (selectedPeriod === "AM" && selectedHour === 12) {
      hours24 = 0
    }

    const newTime = `${hours24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`
    onChange(newTime)
  }, [selectedHour, selectedMinute, selectedPeriod, onChange])

  // Effect to call handleTimeChange when any of the time components change
  React.useEffect(() => {
    if (!isInitialRender.current) {
      handleTimeChange()
    }
  }, [selectedHour, selectedMinute, selectedPeriod, handleTimeChange])

  // Format the displayed time
  const formattedTime = `${selectedHour}:${selectedMinute.toString().padStart(2, "0")} ${selectedPeriod}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formattedTime}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{formattedTime}</div>
            <div className="flex space-x-1">
              <Button
                type="button"
                variant={selectedPeriod === "AM" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedPeriod("AM")
                  // Removed setTimeout here
                }}
              >
                AM
              </Button>
              <Button
                type="button"
                variant={selectedPeriod === "PM" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedPeriod("PM")
                  // Removed setTimeout here
                }}
              >
                PM
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "hour" | "minute")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hour">Hour</TabsTrigger>
              <TabsTrigger value="minute">Minute</TabsTrigger>
            </TabsList>
            <TabsContent value="hour" className="mt-2">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <Button
                    key={hour}
                    type="button"
                    variant={selectedHour === hour ? "default" : "outline"}
                    className={cn("h-10 w-10", selectedHour === hour ? "bg-primary text-primary-foreground" : "")}
                    onClick={() => {
                      setSelectedHour(hour)
                      // Removed setTimeout here
                    }}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="minute" className="mt-2">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    type="button"
                    variant={selectedMinute === minute ? "default" : "outline"}
                    className={cn("h-10 w-10", selectedMinute === minute ? "bg-primary text-primary-foreground" : "")}
                    onClick={() => {
                      setSelectedMinute(minute)
                      // Removed setTimeout here
                    }}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="custom-minute">Custom minute</Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="custom-minute"
                    type="number"
                    min={0}
                    max={59}
                    value={selectedMinute}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (!isNaN(value) && value >= 0 && value <= 59) {
                        setSelectedMinute(value)
                      }
                    }}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="ml-2"
                    onClick={() => handleTimeChange()}
                  >
                    Set
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Set to current time
                const now = new Date()
                const hours = now.getHours()
                const minutes = now.getMinutes()

                // Update state
                setSelectedHour(hours % 12 || 12)
                setSelectedMinute(minutes)
                setSelectedPeriod(hours >= 12 ? "PM" : "AM")
                // Removed setTimeout here
              }}
            >
              Now
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                // Apply changes
                handleTimeChange()

                // Close popover by simulating Escape key
                const event = new KeyboardEvent("keydown", { key: "Escape" })
                document.dispatchEvent(event)
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
