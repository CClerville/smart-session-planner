// =============================================================================
// API PACKAGE - Public Exports
// =============================================================================
// This file exports everything needed by consumers of this package.
// - AppRouter type for tRPC clients
// - Router instance for server setup
// - Context type for server configuration
// =============================================================================

// -----------------------------------------------------------------------------
// Router Exports
// -----------------------------------------------------------------------------

/** The merged app router - used by the API server */
export { appRouter } from "./root.js";

/** Router type - used by tRPC clients for type inference */
export type { AppRouter } from "./root.js";

// -----------------------------------------------------------------------------
// tRPC Exports
// -----------------------------------------------------------------------------

/** Context type - used by API server to create context */
export type { Context } from "./trpc.js";

// -----------------------------------------------------------------------------
// Auth Utilities
// -----------------------------------------------------------------------------

/** Token verification for auth middleware */
export { createToken, verifyToken } from "./lib/auth.js";

// -----------------------------------------------------------------------------
// Schema Exports (for client-side validation)
// -----------------------------------------------------------------------------

export {
  // Availability
  availabilityWindowSchema,
  // Sessions
  createSessionSchema,
  // Session Types
  createSessionTypeSchema,
  // Suggestions
  getSuggestionsSchema,
  // Common
  idSchema, listSessionsSchema, loginSchema,
  // Auth
  registerSchema, updateSessionSchema, updateSessionTypeSchema, upsertAvailabilitySchema
} from "./lib/schemas.js";

