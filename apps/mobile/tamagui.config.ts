// =============================================================================
// TAMAGUI CONFIGURATION
// =============================================================================
// Custom theme configuration for the Smart Session Planner app.
// Uses a modern dark theme with accent colors for priorities.
// =============================================================================

import { createTamagui } from "tamagui";
import { config as configBase } from "@tamagui/config/v3";

// -----------------------------------------------------------------------------
// Custom Tokens
// -----------------------------------------------------------------------------

const customTokens = {
  ...configBase.tokens,
  color: {
    ...configBase.tokens.color,
    // Priority colors
    priority1: "#6B7280", // Gray - lowest
    priority2: "#3B82F6", // Blue
    priority3: "#22C55E", // Green - default
    priority4: "#F59E0B", // Orange
    priority5: "#EF4444", // Red - highest

    // Status colors
    scheduled: "#3B82F6",
    completed: "#22C55E",
    cancelled: "#6B7280",

    // Brand colors
    brand: "#8B5CF6", // Purple accent
    brandLight: "#A78BFA",
    brandDark: "#7C3AED",
  },
};

// -----------------------------------------------------------------------------
// Create Tamagui Config
// -----------------------------------------------------------------------------

export const config = createTamagui({
  ...configBase,
  tokens: customTokens,
  themes: {
    ...configBase.themes,
    // Customize dark theme
    dark: {
      ...configBase.themes.dark,
      brand: customTokens.color.brand,
      brandLight: customTokens.color.brandLight,
      brandDark: customTokens.color.brandDark,
    },
    // Customize light theme
    light: {
      ...configBase.themes.light,
      brand: customTokens.color.brand,
      brandLight: customTokens.color.brandLight,
      brandDark: customTokens.color.brandDark,
    },
  },
});

export default config;

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

