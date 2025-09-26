"use client"

import React from 'react'
import { DateRangeAnalytics } from '@/components/DateRangeAnalytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Globe } from 'lucide-react'

export default function AnalyticsDemo() {
  // Mock merchant ID for demo
  const merchantId = "demo-merchant-123"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Analytics dashboard with enhanced date picker functionality including calendar loading, time inputs, and GMT timezone support
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              Calendar Loading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calendar opens automatically with preset options and drag-to-select range functionality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-green-500" />
              Time Input Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Select specific times with time picker and preset time buttons for precise analytics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-purple-500" />
              GMT Timezone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All date and time selections are handled in GMT timezone for consistency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Enhanced Date Range Analytics
            <Badge variant="secondary" className="ml-2">Enhanced</Badge>
          </CardTitle>
          <CardDescription>
            Try both date-only and date-time modes to see the enhanced functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangeAnalytics 
            merchantId={merchantId}
            currencySymbol="$"
          />
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Enhanced Date Picker</CardTitle>
          <CardDescription>
            Step-by-step guide to using the enhanced analytics date picker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Choose Date Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Toggle between "Date Only" for simple date selection or "Date & Time (GMT)" for precise time-based analytics
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Select Date Range</h4>
                <p className="text-sm text-muted-foreground">
                  Click the date picker to open the calendar. Use preset buttons for quick selection or manually select dates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Set Time (if enabled)</h4>
                <p className="text-sm text-muted-foreground">
                  When using Date & Time mode, set specific start and end times using the time picker or preset time buttons
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Generate Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Generate Analytics" to load transaction data for the selected date/time range
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            Details about the enhanced date picker implementation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Features Implemented</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Calendar loading on selection</li>
                <li>• Time input with presets</li>
                <li>• GMT timezone support</li>
                <li>• Date range selection</li>
                <li>• Quick preset buttons</li>
                <li>• Manual date/time input</li>
                <li>• Clear functionality</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Components Used</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• EnhancedDatePicker</li>
                <li>• DateRangePickerWithTime</li>
                <li>• UniversalDatePicker</li>
                <li>• useDatePicker hook</li>
                <li>• React Day Picker</li>
                <li>• Date-fns formatting</li>
                <li>• Shadcn UI components</li>
                <li>• Lucide React icons</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
