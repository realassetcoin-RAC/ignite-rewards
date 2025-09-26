import { useState, useCallback } from 'react'
import { DateRange } from 'react-day-picker'

export interface UseDatePickerOptions {
  initialDate?: Date
  initialRange?: DateRange
  timezone?: string
  onDateChange?: (date: Date | undefined) => void
  onRangeChange?: (range: DateRange | undefined) => void
}

export function useDatePicker(options: UseDatePickerOptions = {}) {
  const {
    initialDate,
    initialRange,
    timezone = 'GMT',
    onDateChange,
    onRangeChange
  } = options

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate)
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(initialRange)

  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    onDateChange?.(date)
  }, [onDateChange])

  const handleRangeChange = useCallback((range: DateRange | undefined) => {
    setSelectedRange(range)
    onRangeChange?.(range)
  }, [onRangeChange])

  const clearDate = useCallback(() => {
    setSelectedDate(undefined)
    onDateChange?.(undefined)
  }, [onDateChange])

  const clearRange = useCallback(() => {
    setSelectedRange(undefined)
    onRangeChange?.(undefined)
  }, [onRangeChange])

  const setToday = useCallback(() => {
    const today = new Date()
    setSelectedDate(today)
    onDateChange?.(today)
  }, [onDateChange])

  const setDateRange = useCallback((from: Date, to: Date) => {
    const range = { from, to }
    setSelectedRange(range)
    onRangeChange?.(range)
  }, [onRangeChange])

  const getDateString = useCallback((format: 'iso' | 'display' = 'iso') => {
    if (!selectedDate) return ''
    
    if (format === 'iso') {
      return selectedDate.toISOString()
    }
    
    return selectedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    })
  }, [selectedDate, timezone])

  const getRangeString = useCallback((format: 'iso' | 'display' = 'iso') => {
    if (!selectedRange?.from || !selectedRange?.to) return ''
    
    if (format === 'iso') {
      return `${selectedRange.from.toISOString()} - ${selectedRange.to.toISOString()}`
    }
    
    return `${selectedRange.from.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    })} - ${selectedRange.to.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    })}`
  }, [selectedRange, timezone])

  return {
    selectedDate,
    selectedRange,
    handleDateChange,
    handleRangeChange,
    clearDate,
    clearRange,
    setToday,
    setDateRange,
    getDateString,
    getRangeString,
    timezone
  }
}
