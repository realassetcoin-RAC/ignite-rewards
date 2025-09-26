"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UniversalDatePicker } from "@/components/ui/universal-date-picker"
import { EnhancedDatePicker, EnhancedDateRangePicker } from "@/components/ui/enhanced-date-picker"
import { DateRangePickerWithTime } from "@/components/admin/DateRangePicker"
import { DateRange } from "react-day-picker"

export function DatePickerDemo() {
  const [singleDate, setSingleDate] = React.useState<Date | undefined>()
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [dateWithTime, setDateWithTime] = React.useState<Date | undefined>()
  const [rangeWithTime, setRangeWithTime] = React.useState<DateRange | undefined>()

  const presets = [
    { label: "Today", value: new Date() },
    { label: "Yesterday", value: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: "Last week", value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Date Picker Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive date picker components with calendar loading, time inputs, and timezone support
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Date Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Single Date Picker</CardTitle>
            <CardDescription>Basic date selection with calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EnhancedDatePicker
              date={singleDate}
              onSelect={setSingleDate}
              placeholder="Select a date"
              presets={presets}
              allowClear={true}
            />
            {singleDate && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Selected:</strong> {singleDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Range Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range Picker</CardTitle>
            <CardDescription>Select a date range with presets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EnhancedDateRangePicker
              dateRange={dateRange}
              onSelect={setDateRange}
              placeholder="Select date range"
              presets={rangePresets}
              allowClear={true}
            />
            {dateRange?.from && dateRange?.to && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Range:</strong> {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date with Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date with Time (GMT)</CardTitle>
            <CardDescription>Date selection with time input and timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EnhancedDatePicker
              date={dateWithTime}
              onSelect={setDateWithTime}
              placeholder="Select date and time"
              showTime={true}
              timezone="GMT"
              presets={presets}
              allowClear={true}
            />
            {dateWithTime && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Selected:</strong> {dateWithTime.toLocaleString()} GMT
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Range with Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range with Time</CardTitle>
            <CardDescription>Date range with time inputs for start and end</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DateRangePickerWithTime
              dateRange={rangeWithTime}
              onDateRangeChange={setRangeWithTime}
              placeholder="Select date and time range"
            />
            {rangeWithTime?.from && rangeWithTime?.to && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Range:</strong> {rangeWithTime.from.toLocaleString()} - {rangeWithTime.to.toLocaleString()} GMT
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Universal Date Picker - Compact */}
        <Card>
          <CardHeader>
            <CardTitle>Universal Date Picker (Compact)</CardTitle>
            <CardDescription>Compact variant with timezone settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalDatePicker
              mode="single"
              value={singleDate}
              onChange={setSingleDate}
              placeholder="Pick a date"
              showTime={true}
              timezone="GMT"
              variant="compact"
              size="sm"
              presets={presets}
            />
          </CardContent>
        </Card>

        {/* Universal Date Picker - Inline */}
        <Card>
          <CardHeader>
            <CardTitle>Universal Date Picker (Inline)</CardTitle>
            <CardDescription>Inline variant with full calendar display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalDatePicker
              mode="range"
              value={dateRange}
              onChange={setDateRange}
              placeholder="Pick a date range"
              showTime={false}
              timezone="GMT"
              variant="inline"
              label="Select Date Range"
              description="Choose a date range for your analysis"
              presets={rangePresets}
            />
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>Code examples for implementing these date pickers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Date Picker</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"

<EnhancedDatePicker
  date={selectedDate}
  onSelect={setSelectedDate}
  placeholder="Select a date"
  presets={presets}
  allowClear={true}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Date Range with Time</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import { DateRangePickerWithTime } from "@/components/admin/DateRangePicker"

<DateRangePickerWithTime
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  placeholder="Select date and time range"
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Universal Date Picker</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import { UniversalDatePicker } from "@/components/ui/universal-date-picker"

<UniversalDatePicker
  mode="single"
  value={date}
  onChange={setDate}
  showTime={true}
  timezone="GMT"
  variant="compact"
  presets={presets}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
