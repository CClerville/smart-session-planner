// =============================================================================
// USER PREFERENCES ROUTER
// =============================================================================
// Manage user-specific settings for the suggestion algorithm.
// Provides get/upsert operations for preferences (created lazily).
// =============================================================================

import { updateUserPreferencesSchema } from "../lib/schemas.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const userPreferencesRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Get - Retrieve user preferences (returns defaults if not set)
  // ---------------------------------------------------------------------------
  get: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await ctx.db.userPreferences.findUnique({
      where: { userId: ctx.user.id },
    });

    // Return existing preferences or defaults
    return {
      maxDailyMinutes: preferences?.maxDailyMinutes ?? 480,
      bufferMinutes: preferences?.bufferMinutes ?? 30,
      preferMornings: preferences?.preferMornings ?? true,
      maxHighPriorityPerDay: preferences?.maxHighPriorityPerDay ?? 2,
    };
  }),

  // ---------------------------------------------------------------------------
  // Upsert - Create or update user preferences
  // ---------------------------------------------------------------------------
  upsert: protectedProcedure
    .input(updateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const preferences = await ctx.db.userPreferences.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          maxDailyMinutes: input.maxDailyMinutes ?? 480,
          bufferMinutes: input.bufferMinutes ?? 30,
          preferMornings: input.preferMornings ?? true,
          maxHighPriorityPerDay: input.maxHighPriorityPerDay ?? 2,
        },
        update: {
          ...(input.maxDailyMinutes !== undefined && {
            maxDailyMinutes: input.maxDailyMinutes,
          }),
          ...(input.bufferMinutes !== undefined && {
            bufferMinutes: input.bufferMinutes,
          }),
          ...(input.preferMornings !== undefined && {
            preferMornings: input.preferMornings,
          }),
          ...(input.maxHighPriorityPerDay !== undefined && {
            maxHighPriorityPerDay: input.maxHighPriorityPerDay,
          }),
        },
      });

      return {
        maxDailyMinutes: preferences.maxDailyMinutes,
        bufferMinutes: preferences.bufferMinutes,
        preferMornings: preferences.preferMornings,
        maxHighPriorityPerDay: preferences.maxHighPriorityPerDay,
      };
    }),
});

