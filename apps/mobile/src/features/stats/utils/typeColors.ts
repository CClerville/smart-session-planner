// Type colors for progress bars and legends
import { getSessionTypeColor } from "@/utils/sessionTypeColors";

// Legacy color mappings for backward compatibility
const TYPE_COLORS: Record<string, string> = {
  "deep work": "#EC4899",
  meditation: "#22C55E",
  workout: "#22C55E",
  meeting: "#6B7280",
  language: "#3B82F6",
  default: "#8B5CF6",
};

/**
 * Gets the color for a session type, using database color if available,
 * otherwise falling back to legacy name-based mapping
 */
export function getTypeColor(
  type: { name: string; color?: string | null; priority?: number } | string
): string {
  // Handle string input for backward compatibility
  if (typeof type === "string") {
    const key = type.toLowerCase();
    return TYPE_COLORS[key] ?? TYPE_COLORS["default"] ?? "#8B5CF6";
  }

  // Use utility function with fallback
  return getSessionTypeColor(
    type.color ?? null,
    type.priority ?? 3,
    type.name
  );
}

