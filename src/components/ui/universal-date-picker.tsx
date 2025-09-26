"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, X, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { EnhancedDatePicker, EnhancedDateRangePicker } from "./enhanced-date-picker"
import { useDatePicker } from "@/hooks/useDatePicker"

export interface UniversalDatePickerProps {
  mode?: 'single' | 'range'
  value?: Date | { from?: Date; to?: Date }
  onChange?: (value: Date | { from?: Date; to?: Date } | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showTime?: boolean
  timezone?: string
  minDate?: Date
  maxDate?: Date
  allowClear?: boolean
  presets?: Array<{
    label: string
    value: Date | { from: Date; to: Date }
  }>
  label?: string
  description?: string
  required?: boolean
  error?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'inline'
}

const timezoneOptions = [
  { value: 'GMT', label: 'GMT (UTC+0)' },
  { value: 'EST', label: 'EST (UTC-5)' },
  { value: 'PST', label: 'PST (UTC-8)' },
  { value: 'CET', label: 'CET (UTC+1)' },
  { value: 'JST', label: 'JST (UTC+9)' },
  { value: 'AEST', label: 'AEST (UTC+10)' }
]

export function UniversalDatePicker({
  mode = 'single',
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  showTime = false,
  timezone = 'GMT',
  minDate,
  maxDate,
  allowClear = true,
  presets,
  label,
  description,
  required = false,
  error,
  size = 'md',
  variant = 'default'
}: UniversalDatePickerProps) {
  const [selectedTimezone, setSelectedTimezone] = React.useState(timezone)
  const [showSettings, setShowSettings] = React.useState(false)

  const {
    selectedDate,
    selectedRange,
    handleDateChange,
    handleRangeChange,
    clearDate,
    clearRange
  } = useDatePicker({
    initialDate: mode === 'single' ? (value as Date) : undefined,
    initialRange: mode === 'range' ? (value as { from?: Date; to?: Date }) : undefined,
    timezone: selectedTimezone,
    onDateChange: (date) => onChange?.(date),
    onRangeChange: (range) => onChange?.(range)
  })

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  }

  const handleTimezoneChange = (newTimezone: string) => {
    setSelectedTimezone(newTimezone)
  }

  const handleClear = () => {
    if (mode === 'single') {
      clearDate()
    } else {
      clearRange()
    }
  }

  const formatDisplayValue = () => {
    if (mode === 'single') {
      if (!selectedDate) return placeholder || 'Pick a date'
      
      if (showTime) {
        return `${format(selectedDate, 'PPP')} ${format(selectedDate, 'HH:mm')} ${selectedTimezone}`
      }
      return format(selectedDate, 'PPP')
    } else {
      if (!selectedRange?.from) return placeholder || 'Pick a date range'
      
      const fromStr = showTime 
        ? `${format(selectedRange.from, 'MMM dd, yyyy')} ${format(selectedRange.from, 'HH:mm')}`
        : format(selectedRange.from, 'MMM dd, yyyy')
      
      if (!selectedRange.to) return `${fromStr} - Select end date`
      
      const toStr = showTime 
        ? `${format(selectedRange.to, 'MMM dd, yyyy')} ${format(selectedRange.to, 'HH:mm')}`
        : format(selectedRange.to, 'MMM dd, yyyy')
      
      return `${fromStr} - ${toStr} ${selectedTimezone}`
    }
  }

  if (variant === 'inline') {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
        {mode === 'single' ? (
          <EnhancedDatePicker
            date={selectedDate}
            onSelect={handleDateChange}
            placeholder={placeholder}
            disabled={disabled}
            showTime={showTime}
            timezone={selectedTimezone}
            minDate={minDate}
            maxDate={maxDate}
            presets={presets}
            allowClear={allowClear}
          />
        ) : (
          <EnhancedDateRangePicker
            dateRange={selectedRange}
            onSelect={handleRangeChange}
            placeholder={placeholder}
            disabled={disabled}
            showTime={showTime}
            timezone={selectedTimezone}
            minDate={minDate}
            maxDate={maxDate}
            presets={presets}
            allowClear={allowClear}
          />
        )}
        
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !value && "text-muted-foreground",
                sizeClasses[size]
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate max-w-[200px]">
                {formatDisplayValue()}
              </span>
              {allowClear && value && (
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
            {mode === 'single' ? (
              <EnhancedDatePicker
                date={selectedDate}
                onSelect={handleDateChange}
                placeholder={placeholder}
                disabled={disabled}
                showTime={showTime}
                timezone={selectedTimezone}
                minDate={minDate}
                maxDate={maxDate}
                presets={presets}
                allowClear={allowClear}
              />
            ) : (
              <EnhancedDateRangePicker
                dateRange={selectedRange}
                onSelect={handleRangeChange}
                placeholder={placeholder}
                disabled={disabled}
                showTime={showTime}
                timezone={selectedTimezone}
                minDate={minDate}
                maxDate={maxDate}
                presets={presets}
                allowClear={allowClear}
              />
            )}
          </PopoverContent>
        </Popover>
        
        {showTime && (
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timezone</Label>
                <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !value && "text-muted-foreground",
                sizeClasses[size]
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">
                {formatDisplayValue()}
              </span>
              {allowClear && value && (
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
            {mode === 'single' ? (
              <EnhancedDatePicker
                date={selectedDate}
                onSelect={handleDateChange}
                placeholder={placeholder}
                disabled={disabled}
                showTime={showTime}
                timezone={selectedTimezone}
                minDate={minDate}
                maxDate={maxDate}
                presets={presets}
                allowClear={allowClear}
              />
            ) : (
              <EnhancedDateRangePicker
                dateRange={selectedRange}
                onSelect={handleRangeChange}
                placeholder={placeholder}
                disabled={disabled}
                showTime={showTime}
                timezone={selectedTimezone}
                minDate={minDate}
                maxDate={maxDate}
                presets={presets}
                allowClear={allowClear}
              />
            )}
          </PopoverContent>
        </Popover>
        
        {showTime && (
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timezone</Label>
                <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
