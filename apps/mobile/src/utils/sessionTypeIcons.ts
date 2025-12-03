// =============================================================================
// SESSION TYPE ICON UTILITIES
// =============================================================================
// Utilities for handling session type icons with fallbacks.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";

// -----------------------------------------------------------------------------
// Icon Type
// -----------------------------------------------------------------------------

export type IconName = keyof typeof Ionicons.glyphMap;

// -----------------------------------------------------------------------------
// Default Icon Palette
// -----------------------------------------------------------------------------

/** Common icons available for selection */
export const DEFAULT_ICONS: IconName[] = [
  "calendar",
  "time",
  "fitness",
  "leaf",
  "people",
  "code-slash",
  "book",
  "musical-notes",
  "language",
  "school",
  "barbell",
  "bicycle",
  "cafe",
  "chatbubbles",
  "laptop",
  "bulb",
  "flame",
  "heart",
  "star",
  "trophy",
  "medal",
  "rocket",
  "pencil",
  "brush",
  "camera",
  "videocam",
  "headset",
  "game-controller",
  "restaurant",
  "car",
  "briefcase",
  "chatbox",
] as const;

// -----------------------------------------------------------------------------
// Legacy Icon Mappings (for backward compatibility)
// -----------------------------------------------------------------------------

/** Legacy icon mappings based on session type name */
const LEGACY_ICONS: Record<string, IconName> = {
  meditation: "leaf",
  meeting: "people",
  "deep work": "code-slash",
  workout: "fitness",
  exercise: "fitness",
  language: "language",
  default: "calendar",
};

// -----------------------------------------------------------------------------
// Icon Utility Functions
// -----------------------------------------------------------------------------

/**
 * Gets the icon name for a session type with fallback logic
 */
export function getSessionTypeIcon(
  icon: string | null | undefined,
  name?: string
): IconName {
  // Use provided icon if available and valid
  if (icon && isValidIconName(icon)) {
    return icon as IconName;
  }

  // Fall back to legacy name-based mapping
  if (name) {
    const lower = name.toLowerCase();
    
    // Check for exact matches
    if (LEGACY_ICONS[lower]) {
      return LEGACY_ICONS[lower];
    }

    // Check for partial matches
    if (lower.includes("meditation")) return "leaf";
    if (lower.includes("meeting")) return "people";
    if (lower.includes("deep work") || lower.includes("focus")) return "code-slash";
    if (lower.includes("workout") || lower.includes("exercise")) return "fitness";
    if (lower.includes("language")) return "language";
    if (lower.includes("reading") || lower.includes("book")) return "book";
    if (lower.includes("music")) return "musical-notes";
    if (lower.includes("study") || lower.includes("learn")) return "school";
  }

  // Default fallback
  return "calendar";
}

/**
 * Validates if a string is a valid Ionicons icon name
 */
export function isValidIconName(iconName: string): boolean {
  return iconName in Ionicons.glyphMap;
}

