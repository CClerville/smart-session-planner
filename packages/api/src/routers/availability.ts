// =============================================================================
// AVAILABILITY ROUTER
// =============================================================================
// Manage user's weekly availability windows.
// Supports batch upsert for setting entire weekly schedule at once.
// =============================================================================

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import { upsertAvailabilitySchema, idSchema } from "../lib/schemas.js";

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const availabilityRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Get - Retrieve all availability windows for user
  // ---------------------------------------------------------------------------
  get: protectedProcedure.query(async ({ ctx }) => {
    const availabilities = await ctx.db.availability.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return availabilities;
  }),

  // ---------------------------------------------------------------------------
  // Upsert - Replace all availability windows (batch operation)
  // ---------------------------------------------------------------------------
  // This deletes existing windows and creates new ones in a transaction.
  // Simpler than tracking individual updates for a weekly schedule.
  // ---------------------------------------------------------------------------
  upsert: protectedProcedure
    .input(upsertAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      // Use a transaction to ensure atomicity
      const result = await ctx.db.$transaction(async (tx) => {
        // Delete all existing availability for this user
        await tx.availability.deleteMany({
          where: { userId: ctx.user.id },
        });

        // Create new availability windows
        if (input.length > 0) {
          await tx.availability.createMany({
            data: input.map((window) => ({
              ...window,
              userId: ctx.user.id,
            })),
          });
        }

        // Return the newly created windows
        return tx.availability.findMany({
          where: { userId: ctx.user.id },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });
      });

      return result;
    }),

  // ---------------------------------------------------------------------------
  // Delete - Remove single availability window
  // ---------------------------------------------------------------------------
  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.availability.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Availability window not found",
        });
      }

      await ctx.db.availability.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

