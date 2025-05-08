import { format } from "date-fns";

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

/**
 * Format a start date with (00:00) hint
 */
export function formatStartDate(date: Date): string {
  return `${format(date, "MMM d, yyyy")} (00:00)`;
}

/**
 * Format an end date with (23:59) hint
 */
export function formatEndDate(date: Date): string {
  return `${format(date, "MMM d, yyyy")} (23:59)`;
}

/**
 * Format a date range showing start and end dates
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  // If dates are on the same day
  if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
    return `${format(startDate, "MMM d, yyyy")} (full day)`;
  }
  
  // Different days
  return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
} 