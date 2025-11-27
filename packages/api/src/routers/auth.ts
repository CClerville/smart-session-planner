// =============================================================================
// AUTH ROUTER
// =============================================================================
// Handles user registration, login, and profile retrieval.
// Uses JWT for stateless authentication.
// =============================================================================

import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../trpc.js";
import { registerSchema, loginSchema } from "../lib/schemas.js";
import {
  hashPassword,
  verifyPassword,
  createToken,
} from "../lib/auth.js";

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const authRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Register - Create a new user account
  // ---------------------------------------------------------------------------
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password, name } = input;

      // Check if email is already taken
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already registered",
        });
      }

      // Hash password before storing
      const passwordHash = await hashPassword(password);

      // Create the user
      const user = await ctx.db.user.create({
        data: {
          email,
          passwordHash,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "JWT secret not configured",
        });
      }

      const token = await createToken(
        { userId: user.id, email: user.email },
        jwtSecret
      );

      return { token, user };
    }),

  // ---------------------------------------------------------------------------
  // Login - Authenticate existing user
  // ---------------------------------------------------------------------------
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      // Find user by email
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "JWT secret not configured",
        });
      }

      const token = await createToken(
        { userId: user.id, email: user.email },
        jwtSecret
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      };
    }),

  // ---------------------------------------------------------------------------
  // Me - Get current authenticated user
  // ---------------------------------------------------------------------------
  me: protectedProcedure.query(async ({ ctx }) => {
    // User is guaranteed to exist due to protectedProcedure
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),
});

