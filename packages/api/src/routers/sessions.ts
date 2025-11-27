// =============================================================================
// SESSIONS ROUTER
// =============================================================================
// CRUD operations for scheduled sessions with conflict detection.
// =============================================================================

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, type Context } from "../trpc.js";
import {
  createSessionSchema,
  updateSessionSchema,
  listSessionsSchema,
  idSchema,
  limitSchema,
} from "../lib/schemas.js";

// -----------------------------------------------------------------------------
// Helper: Check for time conflicts
// -----------------------------------------------------------------------------

async function checkConflict(
  db: Context["db"],
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<boolean> {
  const conflict = await db.session.findFirst({
    where: {
      userId,
      status: "SCHEDULED",
      id: excludeId ? { not: excludeId } : undefined,
      // Overlapping condition: existing.start < new.end AND existing.end > new.start
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  return conflict !== null;
}

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const sessionsRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // List - Get sessions with optional filters
  // ---------------------------------------------------------------------------
  list: protectedProcedure
    .input(listSessionsSchema)
    .query(async ({ ctx, input }) => {
      const { from, to, typeId, status } = input;

      const sessions = await ctx.db.session.findMany({
        where: {
          userId: ctx.user.id,
          ...(from && { startTime: { gte: from } }),
          ...(to && { startTime: { lte: to } }),
          ...(typeId && { sessionTypeId: typeId }),
          ...(status && { status }),
        },
        include: {
          sessionType: {
            select: {
              id: true,
              name: true,
              color: true,
              priority: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
      });

      return sessions;
    }),

  // ---------------------------------------------------------------------------
  // Upcoming - Get next N scheduled sessions
  // ---------------------------------------------------------------------------
  upcoming: protectedProcedure
    .input(limitSchema)
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.session.findMany({
        where: {
          userId: ctx.user.id,
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
        include: {
          sessionType: {
            select: {
              id: true,
              name: true,
              color: true,
              priority: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
        take: input.limit,
      });

      return sessions;
    }),

  // ---------------------------------------------------------------------------
  // Get - Get single session by ID
  // ---------------------------------------------------------------------------
  get: protectedProcedure
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.session.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          sessionType: true,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      return session;
    }),

  // ---------------------------------------------------------------------------
  // Create - Schedule new session with conflict check
  // ---------------------------------------------------------------------------
  create: protectedProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify session type exists and belongs to user
      const sessionType = await ctx.db.sessionType.findFirst({
        where: {
          id: input.sessionTypeId,
          userId: ctx.user.id,
        },
      });

      if (!sessionType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session type not found",
        });
      }

      // Check for time conflicts
      const hasConflict = await checkConflict(
        ctx.db,
        ctx.user.id,
        input.startTime,
        input.endTime
      );

      if (hasConflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This time slot conflicts with an existing session",
        });
      }

      // Create the session
      const session = await ctx.db.session.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
        include: {
          sessionType: {
            select: {
              id: true,
              name: true,
              color: true,
              priority: true,
            },
          },
        },
      });

      return session;
    }),

  // ---------------------------------------------------------------------------
  // Update - Modify existing session
  // ---------------------------------------------------------------------------
  update: protectedProcedure
    .input(updateSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const existing = await ctx.db.session.findFirst({
        where: { id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      // If times are being updated, check for conflicts
      const newStart = data.startTime ?? existing.startTime;
      const newEnd = data.endTime ?? existing.endTime;

      if (data.startTime || data.endTime) {
        const hasConflict = await checkConflict(
          ctx.db,
          ctx.user.id,
          newStart,
          newEnd,
          id // Exclude current session from conflict check
        );

        if (hasConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This time slot conflicts with an existing session",
          });
        }
      }

      // If session type is being changed, verify it exists
      if (data.sessionTypeId) {
        const sessionType = await ctx.db.sessionType.findFirst({
          where: {
            id: data.sessionTypeId,
            userId: ctx.user.id,
          },
        });

        if (!sessionType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session type not found",
          });
        }
      }

      return ctx.db.session.update({
        where: { id },
        data,
        include: {
          sessionType: {
            select: {
              id: true,
              name: true,
              color: true,
              priority: true,
            },
          },
        },
      });
    }),

  // ---------------------------------------------------------------------------
  // Delete - Remove session
  // ---------------------------------------------------------------------------
  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.session.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      await ctx.db.session.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------------------------
  // Complete - Mark session as completed
  // ---------------------------------------------------------------------------
  complete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.session.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (existing.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session is already completed",
        });
      }

      return ctx.db.session.update({
        where: { id: input.id },
        data: { status: "COMPLETED" },
        include: {
          sessionType: {
            select: {
              id: true,
              name: true,
              color: true,
              priority: true,
            },
          },
        },
      });
    }),
});

