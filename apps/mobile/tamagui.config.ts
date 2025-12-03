
import { config as configBase } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

// -----------------------------------------------------------------------------
// Design System Colors (from Figma)
// -----------------------------------------------------------------------------

const designColors = {
  // Background colors
  pageBg: "#F9FAFB", // Light lavender background
  cardBg: "#FFFFFF", // White card background
  
  // Text colors
  textPrimary: "#1A1A1A", // Dark grey for headings
  textSecondary: "#6B7280", // Medium grey for secondary text
  textMuted: "#9CA3AF", // Light grey for muted text
  
  // Button colors
  buttonPrimary: "#1A1A1A", // Dark grey/black primary button
  buttonSecondary: "#F3F4F6", // Light grey secondary button bg
  buttonSecondaryBg: "#F3F4F6", // Light grey secondary button bg
  buttonSecondaryBorder: "#E5E7EB", // Secondary button border
  
  // Border colors
  borderLight: "#E5E7EB", // Light border color
  
  // Status colors
  success: "#22C55E", // Green success color
  danger: "#EF4444", // Red for errors
  dangerBg: "#FEE2E2", // Light red background for error messages
  
  // Session type colors
  meditation: "#22C55E", // Green
  meditationBg: "#DCFCE7", // Light green background
  meeting: "#6B7280", // Grey
  meetingBg: "#F3F4F6", // Light grey background
  deepWork: "#8B5CF6", // Purple
  deepWorkBg: "#EDE9FE", // Light purple background
  workout: "#22C55E", // Green
  workoutBg: "#DCFCE7", // Light green background
  
  // Progress bar colors
  progressPink: "#EC4899", // Pink/Magenta for Deep Work
  progressGreen: "#22C55E", // Green for Workout
  progressBlue: "#3B82F6", // Blue for Language
  
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
  
  // Accent/Brand
  brand: "#1A1A1A", // Dark grey as primary brand
  brandLight: "#374151",
  brandDark: "#000000",
  accent: "#8B5CF6", // Purple accent for special highlights
  accentLight: "#A78BFA",
  
  // Schedule-specific colors
  todayBg: "#1A1A1A", // Dark background for today in schedule
  dayBg: "#F3F4F6", // Light background for other days in schedule
};

// -----------------------------------------------------------------------------
// Custom Tokens
// -----------------------------------------------------------------------------

const customTokens = {
  ...configBase.tokens,
  color: {
    ...configBase.tokens.color,
    ...designColors,
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
    // Light theme (primary theme matching Figma)
    light: {
      ...configBase.themes.light,
      background: designColors.pageBg,
      backgroundHover: "#F0E8F0",
      backgroundPress: "#E8E0E8",
      backgroundFocus: "#F0E8F0",
      color: designColors.textPrimary,
      colorHover: designColors.textPrimary,
      colorPress: designColors.textSecondary,
      // Map standard Tamagui tokens to our design colors
      color12: designColors.textPrimary, // $color12 → textPrimary
      gray2: designColors.cardBg, // $gray2 → cardBg (white)
      gray10: designColors.textSecondary, // $gray10 → textSecondary
      gray11: designColors.textMuted, // $gray11 → textMuted for labels
      gray3: designColors.buttonSecondary, // $gray3 → buttonSecondary
      gray4: designColors.buttonSecondary, // $gray4 → buttonSecondary
      gray6: designColors.borderLight, // $gray6 → borderLight
      // Brand and accent
      brand: designColors.brand,
      brandLight: designColors.brandLight,
      brandDark: designColors.brandDark,
      accent: designColors.accent,
      accentLight: designColors.accentLight,
      // Card styling
      cardBg: designColors.cardBg,
      // Button styling
      buttonPrimary: designColors.buttonPrimary,
      buttonSecondary: designColors.buttonSecondary,
      buttonSecondaryBg: designColors.buttonSecondaryBg,
      buttonSecondaryBorder: designColors.buttonSecondaryBorder,
      // Error states
      red2: designColors.dangerBg, // $red2 → dangerBg (light red)
      red6: designColors.danger, // $red6 → danger (red)
      red10: designColors.danger, // $red10 → danger (red)
      // Success states
      green9: designColors.success, // $green9 → success
      // Other colors
      blue5: "#DBEAFE", // Light blue background
      green5: "#DCFCE7", // Light green background
      orange5: "#FEF3C7", // Light orange background
      red4: designColors.dangerBg, // $red4 → dangerBg
      // Schedule colors
      todayBg: designColors.todayBg,
      dayBg: designColors.dayBg,
    },
    // Dark theme (fallback)
    dark: {
      ...configBase.themes.dark,
      brand: designColors.brand,
      brandLight: designColors.brandLight,
      brandDark: designColors.brandDark,
      accent: designColors.accent,
      accentLight: designColors.accentLight,
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

// -----------------------------------------------------------------------------
// Export designColors for direct access when needed
// -----------------------------------------------------------------------------

export { designColors };

