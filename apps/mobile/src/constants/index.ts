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

