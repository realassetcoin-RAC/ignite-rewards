"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface EnhancedDatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showTime?: boolean
  timezone?: string
  minDate?: Date
  maxDate?: Date
  presets?: Array<{
    label: string
    value: Date
  }>
  allowClear?: boolean
  format?: string
}

export interface EnhancedDateRangePickerProps {
  dateRange?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showTime?: boolean
  timezone?: string
  minDate?: Date
  maxDate?: Date
  presets?: Array<{
    label: string
    value: DateRange
  }>
  allowClear?: boolean
}

const timePresets = [
  { label: "00:00", value: "00:00" },
  { label: "06:00", value: "06:00" },
  { label: "09:00", value: "09:00" },
  { label: "12:00", value: "12:00" },
  { label: "15:00", value: "15:00" },
  { label: "18:00", value: "18:00" },
  { label: "21:00", value: "21:00" },
]

const datePresets = [
  {
    label: "Today",
    value: new Date()
  },
  {
    label: "Yesterday",
    value: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    label: "Last 7 days",
    value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    label: "Last 30 days",
    value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
]

const rangePresets = [
  {
    label: "Last 7 days",
    value: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: "Last 30 days",
    value: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: "Last 90 days",
    value: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: "This month",
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    }
  },
  {
    label: "Last month",
    value: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    }
  }
]

export function EnhancedDatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  showTime = false,
  timezone = "GMT",
  minDate,
  maxDate,
  presets = datePresets,
  allowClear = true,
  format: dateFormat = "PPP"
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "00:00"
  )

  React.useEffect(() => {
    setSelectedDate(date)
    if (date) {
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date, showTime])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      onSelect?.(undefined)
      return
    }

    let finalDate = new Date(newDate)
    
    if (showTime) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      finalDate.setHours(hours, minutes, 0, 0)
    }

    setSelectedDate(finalDate)
    onSelect?.(finalDate)
    
    // Keep calendar open - don't close automatically
    // User can click outside to close
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes, 0, 0)
      
      setSelectedDate(newDateTime)
      onSelect?.(newDateTime)
    }
  }


  const handlePresetSelect = (preset: typeof presets[0]) => {
    // Set time to start of day (00:00) for quick select presets BEFORE selecting date
    if (showTime) {
      setTimeValue("00:00")
      // Create a new date with start of day time
      const presetDate = new Date(preset.value)
      presetDate.setHours(0, 0, 0, 0)
      handleDateSelect(presetDate)
    } else {
      handleDateSelect(preset.value)
    }
    // Keep calendar open - don't close automatically
    // User can click outside to close
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setInputValue("")
    setTimeValue("00:00")
    onSelect?.(undefined)
  }

  const formatDisplayDate = (date: Date) => {
    if (showTime) {
      return `${format(date, dateFormat)} ${format(date, "HH:mm")} ${timezone}`
    }
    return format(date, dateFormat)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
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
            {allowClear && selectedDate && (
              <X 
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {presets.length > 0 && (
              <div className="p-3 border-r">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Quick Select</p>
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }}
              />
              {showTime && (
                <div className="p-3 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Time</Label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">{timezone}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {timePresets.map((preset) => (
                        <Button
                          key={preset.value}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleTimeChange(preset.value)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function EnhancedDateRangePicker({
  dateRange,
  onSelect,
  placeholder = "Pick a date range",
  disabled = false,
  className,
  showTime = false,
  timezone = "GMT",
  minDate,
  maxDate,
  presets = rangePresets,
  allowClear = true
}: EnhancedDateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(dateRange)
  const [startTime, setStartTime] = React.useState<string>(
    dateRange?.from ? format(dateRange.from, "HH:mm") : "00:00"
  )
  const [endTime, setEndTime] = React.useState<string>(
    dateRange?.to ? format(dateRange.to, "HH:mm") : "23:59"
  )

  React.useEffect(() => {
    setSelectedRange(dateRange)
    if (dateRange?.from) {
      setStartTime(format(dateRange.from, "HH:mm"))
    }
    if (dateRange?.to) {
      setEndTime(format(dateRange.to, "HH:mm"))
    }
  }, [dateRange])

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      setSelectedRange(undefined)
      onSelect?.(undefined)
      return
    }

    let finalRange = { ...range }
    
    if (showTime && range.from) {
      const [hours, minutes] = startTime.split(":").map(Number)
      const newFrom = new Date(range.from)
      newFrom.setHours(hours, minutes, 0, 0)
      finalRange.from = newFrom
    }
    
    if (showTime && range.to) {
      const [hours, minutes] = endTime.split(":").map(Number)
      const newTo = new Date(range.to)
      newTo.setHours(hours, minutes, 59, 999)
      finalRange.to = newTo
    }

    setSelectedRange(finalRange)
    onSelect?.(finalRange)
    
    // Keep calendar open - don't close automatically
    // User can click outside to close
  }

  const handleStartTimeChange = (newTime: string) => {
    setStartTime(newTime)
    
    if (selectedRange?.from) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newFrom = new Date(selectedRange.from)
      newFrom.setHours(hours, minutes, 0, 0)
      
      const updatedRange = {
        ...selectedRange,
        from: newFrom
      }
      setSelectedRange(updatedRange)
      onSelect?.(updatedRange)
    }
  }

  const handleEndTimeChange = (newTime: string) => {
    setEndTime(newTime)
    
    if (selectedRange?.to) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newTo = new Date(selectedRange.to)
      newTo.setHours(hours, minutes, 59, 999)
      
      const updatedRange = {
        ...selectedRange,
        to: newTo
      }
      setSelectedRange(updatedRange)
      onSelect?.(updatedRange)
    }
  }

  const handlePresetSelect = (preset: typeof presets[0]) => {
    // Set time to start of day (00:00) for quick select presets BEFORE selecting range
    if (showTime) {
      setStartTime("00:00")
      setEndTime("23:59")
      // Create new range with proper times
      const newRange = {
        from: preset.value.from ? new Date(preset.value.from) : undefined,
        to: preset.value.to ? new Date(preset.value.to) : undefined
      }
      if (newRange.from) {
        newRange.from.setHours(0, 0, 0, 0)
      }
      if (newRange.to) {
        newRange.to.setHours(23, 59, 59, 999)
      }
      handleRangeSelect(newRange)
    } else {
      handleRangeSelect(preset.value)
    }
    // Keep calendar open - don't close automatically
    // User can click outside to close
  }

  const handleClear = () => {
    setSelectedRange(undefined)
    setStartTime("00:00")
    setEndTime("23:59")
    onSelect?.(undefined)
  }

  const formatDisplayRange = (range: DateRange) => {
    if (!range.from) return ""
    
    const fromStr = showTime 
      ? `${format(range.from, "MMM dd, yyyy")} ${format(range.from, "HH:mm")}`
      : format(range.from, "MMM dd, yyyy")
    
    if (!range.to) return `${fromStr} - Select end date`
    
    const toStr = showTime 
      ? `${format(range.to, "MMM dd, yyyy")} ${format(range.to, "HH:mm")}`
      : format(range.to, "MMM dd, yyyy")
    
    return `${fromStr} - ${toStr} ${timezone}`
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedRange?.from && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange?.from ? (
              formatDisplayRange(selectedRange)
            ) : (
              <span>{placeholder}</span>
            )}
            {allowClear && selectedRange?.from && (
              <X 
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {presets.length > 0 && (
              <div className="p-3 border-r">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Quick Select</p>
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                initialFocus
                disabled={(date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }}
              />
              {showTime && (
                <div className="p-3 border-t">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Time Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Start Time</Label>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            className="w-24 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">End Time</Label>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => handleEndTimeChange(e.target.value)}
                            className="w-24 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {timezone}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
