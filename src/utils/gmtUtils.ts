// GMT Timezone Utilities
// Utility functions for handling GMT timezone conversion and validation

/**
 * Converts a date to GMT timezone
 * @param date - The date to convert
 * @returns Date in GMT timezone
 */
export function convertToGMT(date: Date): Date {
  // Create a new date object in GMT
  const gmtDate = new Date(date);
  
  // Convert to GMT by setting UTC hours
  const utcDate = new Date(gmtDate.getTime() + (gmtDate.getTimezoneOffset() * 60000));
  
  return utcDate;
}

/**
 * Formats a date for display in GMT with timezone indicator
 * @param date - The date to format
 * @param includeTime - Whether to include time in the format
 * @returns Formatted date string with GMT indicator
 */
export function formatDateGMT(date: Date, includeTime: boolean = true): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'GMT',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  const formatted = new Intl.DateTimeFormat('en-GB', options).format(date);
  return includeTime ? `${formatted} GMT` : formatted;
}

/**
 * Validates that a date is in GMT timezone
 * @param date - The date to validate
 * @returns True if the date is in GMT, false otherwise
 */
export function isDateInGMT(date: Date): boolean {
  // Check if the timezone offset is 0 (GMT/UTC)
  return date.getTimezoneOffset() === 0;
}

/**
 * Ensures a date is stored in GMT format
 * @param date - The date to ensure is in GMT
 * @returns Date guaranteed to be in GMT
 */
export function ensureGMT(date: Date): Date {
  if (isDateInGMT(date)) {
    return date;
  }
  
  // Convert to GMT
  return convertToGMT(date);
}

/**
 * Creates a GMT date from date components
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Date in GMT timezone
 */
export function createGMTDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): Date {
  // Create date in GMT using UTC methods
  const gmtDate = new Date();
  gmtDate.setUTCFullYear(year);
  gmtDate.setUTCMonth(month);
  gmtDate.setUTCDate(day);
  gmtDate.setUTCHours(hour);
  gmtDate.setUTCMinutes(minute);
  gmtDate.setUTCSeconds(0);
  gmtDate.setUTCMilliseconds(0);
  
  return gmtDate;
}

/**
 * Validates campaign date range
 * @param startDate - Campaign start date
 * @param endDate - Campaign end date
 * @returns Object with validation result and error message
 */
export function validateCampaignDates(startDate: Date, endDate: Date): {
  isValid: boolean;
  error?: string;
} {
  const now = new Date();
  
  // Check if end date is after start date
  if (endDate <= startDate) {
    return {
      isValid: false,
      error: 'End date must be after start date'
    };
  }
  
  // Check if start date is not in the past
  if (startDate < now) {
    return {
      isValid: false,
      error: 'Start date cannot be in the past'
    };
  }
  
  return { isValid: true };
}

/**
 * Gets current time in GMT
 * @returns Current date/time in GMT
 */
export function getCurrentGMT(): Date {
  return new Date();
}

/**
 * Converts ISO string to GMT date
 * @param isoString - ISO date string
 * @returns Date in GMT timezone
 */
export function parseISOGMT(isoString: string): Date {
  const date = new Date(isoString);
  return ensureGMT(date);
}

/**
 * Formats date for API submission (ISO string in GMT)
 * @param date - Date to format
 * @returns ISO string in GMT
 */
export function formatForAPIGMT(date: Date): string {
  const gmtDate = ensureGMT(date);
  return gmtDate.toISOString();
}

/**
 * Displays timezone information for debugging
 * @param date - Date to analyze
 * @returns Timezone information object
 */
export function getTimezoneInfo(date: Date): {
  timezone: string;
  offset: number;
  isGMT: boolean;
  formatted: string;
} {
  const offset = date.getTimezoneOffset();
  const isGMT = offset === 0;
  
  return {
    timezone: isGMT ? 'GMT' : `UTC${offset > 0 ? '-' : '+'}${Math.abs(offset / 60)}`,
    offset,
    isGMT,
    formatted: formatDateGMT(date)
  };
}
