// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================
// Centralized validation schemas used across tRPC routers.
// These schemas provide both runtime validation and TypeScript types.
// =============================================================================

import { z } from "zod";

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------

/** Email validation with proper format checking */
export const emailSchema = z.string().email("Invalid email address").trim();

/** Password validation with minimum length */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

/** User registration input */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100).trim().optional(),
});

/** User login input */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// -----------------------------------------------------------------------------
// Session Type Schemas
// -----------------------------------------------------------------------------

/** Priority must be 1-5 */
export const prioritySchema = z.number().int().min(1).max(5);

/** Hex color validation (optional) */
export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
  .optional();

/** Create session type input */
export const createSessionTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  category: z.string().max(50).trim().optional(),
  priority: prioritySchema.default(3),
  color: colorSchema,
});

/** Update session type input */
export const updateSessionTypeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).trim().optional(),
  category: z.string().max(50).trim().optional().nullable(),
  priority: prioritySchema.optional(),
  color: colorSchema.nullable(),
});

// -----------------------------------------------------------------------------
// Availability Schemas
// -----------------------------------------------------------------------------

/** Day of week (0 = Sunday, 6 = Saturday) */
export const dayOfWeekSchema = z.number().int().min(0).max(6);

/** Time in HH:MM format (24-hour) */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format");

/** Single availability window */
export const availabilityWindowSchema = z
  .object({
    dayOfWeek: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

/** Batch upsert availability input */
export const upsertAvailabilitySchema = z.array(availabilityWindowSchema);

// -----------------------------------------------------------------------------
// Session Schemas
// -----------------------------------------------------------------------------

/** Session status enum matching Prisma */
export const sessionStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

/** Create session input */
export const createSessionSchema = z
  .object({
    sessionTypeId: z.string().cuid(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    duration: z.number().int().min(5).max(480), // 5 min to 8 hours
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

/** Update session input */
export const updateSessionSchema = z.object({
  id: z.string().cuid(),
  sessionTypeId: z.string().cuid().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  duration: z.number().int().min(5).max(480).optional(),
  notes: z.string().max(1000).optional().nullable(),
  status: sessionStatusSchema.optional(),
});

/** List sessions query params */
export const listSessionsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  typeId: z.string().cuid().optional(),
  status: sessionStatusSchema.optional(),
});

// -----------------------------------------------------------------------------
// Suggestions Schema
// -----------------------------------------------------------------------------

/** Get suggestions input */
export const getSuggestionsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  sessionTypeId: z.string().cuid().optional(),
  duration: z.number().int().min(15).max(480).default(60),
});

// -----------------------------------------------------------------------------
// Common Schemas
// -----------------------------------------------------------------------------

/** ID parameter */
export const idSchema = z.object({
  id: z.string().cuid(),
});

/** Limit parameter for lists */
export const limitSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

