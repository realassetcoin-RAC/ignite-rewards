import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerGMTProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePickerGMT({
  date,
  onSelect,
  placeholder = "Pick a date and time (GMT)",
  disabled = false,
  className
}: DateTimePickerGMTProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "00:00"
  )

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      onSelect?.(undefined)
      return
    }

    // Parse time and combine with date
    const [hours, minutes] = timeValue.split(":").map(Number)
    const combinedDateTime = new Date(newDate)
    combinedDateTime.setUTCHours(hours, minutes, 0, 0)
    
    setSelectedDate(combinedDateTime)
    onSelect?.(combinedDateTime)
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setUTCHours(hours, minutes, 0, 0)
      
      setSelectedDate(newDateTime)
      onSelect?.(newDateTime)
    }
  }

  const formatDisplayDate = (date: Date) => {
    return `${format(date, "PPP")} ${format(date, "HH:mm")} GMT`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            formatDisplayDate(selectedDate)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">GMT</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
