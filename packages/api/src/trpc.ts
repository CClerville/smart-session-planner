// =============================================================================
// tRPC INSTANCE & CONTEXT
// =============================================================================
// This file sets up the tRPC server instance with context creation.
// Context provides database access and authenticated user info to all procedures.
// =============================================================================

import type { db as prismaDb } from "@repo/database";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

// -----------------------------------------------------------------------------
// Context Type
// -----------------------------------------------------------------------------
// The context is available to all tRPC procedures.
// It includes the database client and optionally the authenticated user.
// -----------------------------------------------------------------------------

export interface Context {
  /** Prisma database client */
  db: typeof prismaDb;
  /** Authenticated user (null if not authenticated) */
  user: { id: string; email: string } | null;
}

// -----------------------------------------------------------------------------
// tRPC Initialization
// -----------------------------------------------------------------------------
// We use superjson transformer to properly serialize dates and other types.
// Error formatting extracts Zod validation errors for better client-side handling.
// -----------------------------------------------------------------------------

const t = initTRPC.context<Context>().create({
  // SuperJSON handles Date, Map, Set, BigInt, etc. serialization
  transformer: superjson,

  // Format errors to include Zod validation details
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Include Zod errors for client-side form validation
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// -----------------------------------------------------------------------------
// Exported Procedures & Router
// -----------------------------------------------------------------------------

/** Create a new tRPC router */
export const createTRPCRouter = t.router;

/** Merge multiple routers into one */
export const mergeRouters = t.mergeRouters;

/**
 * Public procedure - no authentication required.
 * Use for login, register, and public endpoints.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication.
 * Throws UNAUTHORIZED error if user is not in context.
 * Use for all authenticated endpoints.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  // Check if user exists in context (set by auth middleware)
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // Pass the non-null user to downstream procedures
  return next({
    ctx: {
      ...ctx,
      // TypeScript now knows user is not null
      user: ctx.user,
    },
  });
});

// Context is already exported from the interface definition above

