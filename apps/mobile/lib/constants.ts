// =============================================================================
// APP CONSTANTS
// =============================================================================
// Shared constants used throughout the mobile app.
// =============================================================================

// -----------------------------------------------------------------------------
// API Configuration
// -----------------------------------------------------------------------------

/**
 * API URL from environment or default to localhost.
 * Set EXPO_PUBLIC_API_URL in your environment for production.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// -----------------------------------------------------------------------------
// Priority Configuration
// -----------------------------------------------------------------------------

export const PRIORITIES = [1, 2, 3, 4, 5] as const;

export type Priority = (typeof PRIORITIES)[number];

/** Priority display labels */
export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "Very Low",
  2: "Low",
  3: "Normal",
  4: "High",
  5: "Critical",
};

/** Priority colors (Tamagui token names) */
export const PRIORITY_COLORS: Record<Priority, string> = {
  1: "#6B7280", // Gray
  2: "#3B82F6", // Blue
  3: "#22C55E", // Green
  4: "#F59E0B", // Orange
  5: "#EF4444", // Red
};

// -----------------------------------------------------------------------------
// Session Status
// -----------------------------------------------------------------------------

export const SESSION_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Status display labels */
export const STATUS_LABELS: Record<SessionStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Status colors */
export const STATUS_COLORS: Record<SessionStatus, string> = {
  SCHEDULED: "#3B82F6", // Blue
  COMPLETED: "#22C55E", // Green
  CANCELLED: "#6B7280", // Gray
};

// -----------------------------------------------------------------------------
// Days of Week
// -----------------------------------------------------------------------------

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAYS_OF_WEEK_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

// -----------------------------------------------------------------------------
// Time Formatting
// -----------------------------------------------------------------------------

/**
 * Format a date to display time (e.g., "9:00 AM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a date to display date (e.g., "Mon, Dec 25")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date to display full date and time
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

