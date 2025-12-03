// =============================================================================
// SESSION TYPES ROUTER
// =============================================================================
// CRUD operations for session types with completed session counts.
// =============================================================================

import { TRPCError } from "@trpc/server";
import {
    createSessionTypeSchema,
    idSchema,
    updateSessionTypeSchema,
} from "../lib/schemas.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const sessionTypesRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // List - Get all session types with completion counts
  // ---------------------------------------------------------------------------
  list: protectedProcedure.query(async ({ ctx }) => {
    const types = await ctx.db.sessionType.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            sessions: {
              where: { status: "COMPLETED" },
            },
          },
        },
      },
    });

    // Transform to include completedCount at top level
    return types.map((type: typeof types[number]) => ({
      id: type.id,
      name: type.name,
      category: type.category,
      priority: type.priority,
      color: type.color,
      icon: type.icon,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      completedCount: type._count.sessions,
    }));
  }),

  // ---------------------------------------------------------------------------
  // Get - Get single session type by ID
  // ---------------------------------------------------------------------------
  get: protectedProcedure
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const type = await ctx.db.sessionType.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      });

      if (!type) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session type not found",
        });
      }

      return {
        ...type,
        totalSessions: type._count.sessions,
      };
    }),

  // ---------------------------------------------------------------------------
  // Create - Add new session type
  // ---------------------------------------------------------------------------
  create: protectedProcedure
    .input(createSessionTypeSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate name
      const existing = await ctx.db.sessionType.findFirst({
        where: {
          userId: ctx.user.id,
          name: input.name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A session type with this name already exists",
        });
      }

      return ctx.db.sessionType.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),

  // ---------------------------------------------------------------------------
  // Update - Modify existing session type
  // ---------------------------------------------------------------------------
  update: protectedProcedure
    .input(updateSessionTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const existing = await ctx.db.sessionType.findFirst({
        where: { id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session type not found",
        });
      }

      // Check name uniqueness if changing name
      if (data.name && data.name !== existing.name) {
        const duplicate = await ctx.db.sessionType.findFirst({
          where: {
            userId: ctx.user.id,
            name: data.name,
            NOT: { id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A session type with this name already exists",
          });
        }
      }

      return ctx.db.sessionType.update({
        where: { id },
        data,
      });
    }),

  // ---------------------------------------------------------------------------
  // Delete - Remove session type (cascades to sessions)
  // ---------------------------------------------------------------------------
  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.sessionType.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session type not found",
        });
      }

      await ctx.db.sessionType.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

