"use client"
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { EnhancedDateRangePicker } from "@/components/ui/enhanced-date-picker"

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }
  return format(date, "MMM dd, yyyy")
}

export function DateRangePickerWithPresets({ 
  dateRange, 
  onDateRangeChange, 
  placeholder = "Pick a date range",
  className 
}: DateRangePickerProps) {
  const presets = [
    {
      label: "Last 7 days",
      value: {
        from: addDays(new Date(), -7),
        to: new Date()
      }
    },
    {
      label: "Last 30 days",
      value: {
        from: addDays(new Date(), -30),
        to: new Date()
      }
    },
    {
      label: "Last 90 days",
      value: {
        from: addDays(new Date(), -90),
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor="date-range" className="text-sm font-medium">
        Date Range
      </Label>
      <EnhancedDateRangePicker
        dateRange={dateRange}
        onSelect={onDateRangeChange}
        placeholder={placeholder}
        presets={presets}
        showTime={false}
        timezone="GMT"
        allowClear={true}
        minDate={new Date("1900-01-01")}
        maxDate={new Date()}
      />
    </div>
  )
}

// Enhanced version with time support
export function DateRangePickerWithTime({ 
  dateRange, 
  onDateRangeChange, 
  placeholder = "Pick a date and time range",
  className 
}: DateRangePickerProps) {
  const presets = [
    {
      label: "Last 7 days",
      value: {
        from: addDays(new Date(), -7),
        to: new Date()
      }
    },
    {
      label: "Last 30 days",
      value: {
        from: addDays(new Date(), -30),
        to: new Date()
      }
    },
    {
      label: "Last 90 days",
      value: {
        from: addDays(new Date(), -90),
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor="date-range" className="text-sm font-medium">
        Date & Time Range (GMT)
      </Label>
      <EnhancedDateRangePicker
        dateRange={dateRange}
        onSelect={onDateRangeChange}
        placeholder={placeholder}
        presets={presets}
        showTime={true}
        timezone="GMT"
        allowClear={true}
        minDate={new Date("1900-01-01")}
        maxDate={new Date()}
      />
    </div>
  )
}