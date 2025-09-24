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
  const [open, setOpen] = React.useState(false)

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

  const handlePresetSelect = (preset: typeof presets[0]) => {
    onDateRangeChange(preset.value)
    setOpen(false)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range)
    // Only close the popover when both dates are selected
    if (range?.from && range?.to) {
      setOpen(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor="date-range" className="text-sm font-medium">
        Date Range
      </Label>
      {dateRange?.from && !dateRange?.to && (
        <p className="text-xs text-muted-foreground">
          Select the end date to complete the range
        </p>
      )}
      <div className="relative flex gap-2">
        <Input
          id="date-range"
          value={
            dateRange?.from && dateRange?.to
              ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
              : dateRange?.from
              ? `${formatDate(dateRange.from)} - Select end date`
              : ""
          }
          placeholder={placeholder}
          className="bg-background pr-10"
          readOnly
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-range-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date range</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <div className="flex">
              <div className="p-3 border-r">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Presets</p>
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
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 Click and drag to select a range
                    </p>
                  </div>
                </div>
              </div>
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                numberOfMonths={2}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                className="rounded-md border"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20 hover:bg-accent/50 transition-colors",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
                  day_today: "bg-accent text-accent-foreground rounded-full",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent/70 rounded-full",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}