// =============================================================================
// SESSION TYPE COLOR UTILITIES
// =============================================================================
// Utilities for handling session type colors with fallbacks.
// =============================================================================

import { PRIORITY_COLORS, type Priority } from "@/constants";

// -----------------------------------------------------------------------------
// Default Color Palette
// -----------------------------------------------------------------------------

/** Predefined color palette for session types */
export const DEFAULT_COLOR_PALETTE = [
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Orange
  "#EF4444", // Red
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#F97316", // Orange-600
  "#84CC16", // Lime
  "#14B8A6", // Teal
  "#A855F7", // Purple-500
  "#E11D48", // Rose
  "#64748B", // Slate
] as const;

// -----------------------------------------------------------------------------
// Legacy Color Mappings (for backward compatibility)
// -----------------------------------------------------------------------------

/** Legacy color mappings based on session type name */
const LEGACY_COLORS: Record<string, { bg: string; icon: string }> = {
  meditation: { bg: "#DCFCE7", icon: "#22C55E" },
  meeting: { bg: "#F3F4F6", icon: "#6B7280" },
  "deep work": { bg: "#EDE9FE", icon: "#8B5CF6" },
  workout: { bg: "#DCFCE7", icon: "#22C55E" },
  default: { bg: "#F3F4F6", icon: "#6B7280" },
};

// -----------------------------------------------------------------------------
// Color Utility Functions
// -----------------------------------------------------------------------------

/**
 * Converts hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Lightens a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);

  return rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
}

/**
 * Derives a background color from a primary color
 * Creates a lighter version suitable for backgrounds
 */
export function deriveBackgroundColor(primaryColor: string): string {
  // Lighten by 85% to create a subtle background
  return lightenColor(primaryColor, 85);
}

/**
 * Gets the primary color for a session type with fallback logic
 */
export function getSessionTypeColor(
  color: string | null | undefined,
  priority: number,
  name?: string
): string {
  // Use provided color if available
  if (color) {
    return color;
  }

  // Fall back to legacy name-based mapping
  if (name) {
    const lower = name.toLowerCase();
    const legacy = LEGACY_COLORS[lower];
    if (legacy) {
      return legacy.icon; // Return the icon color as primary
    }
  }

  // Fall back to priority-based color
  return PRIORITY_COLORS[priority as Priority] ?? PRIORITY_COLORS[3];
}

/**
 * Gets the background color for a session type with fallback logic
 */
export function getSessionTypeBackgroundColor(
  color: string | null | undefined,
  priority: number,
  name?: string
): string {
  // Use provided color if available
  if (color) {
    return deriveBackgroundColor(color);
  }

  // Fall back to legacy name-based mapping
  if (name) {
    const lower = name.toLowerCase();
    const legacy = LEGACY_COLORS[lower];
    if (legacy) {
      return legacy.bg;
    }
  }

  // Fall back to priority-based color (lightened)
  const priorityColor = PRIORITY_COLORS[priority as Priority] ?? PRIORITY_COLORS[3];
  return deriveBackgroundColor(priorityColor);
}

/**
 * Gets both primary and background colors for a session type
 */
export function getSessionTypeStyle(
  color: string | null | undefined,
  priority: number,
  name?: string
): { bg: string; icon: string } {
  const primaryColor = getSessionTypeColor(color, priority, name);
  const bgColor = getSessionTypeBackgroundColor(color, priority, name);

  return {
    bg: bgColor,
    icon: primaryColor,
  };
}

