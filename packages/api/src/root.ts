// =============================================================================
// ROOT ROUTER
// =============================================================================
// Merges all feature routers into a single AppRouter.
// This is the main entry point for tRPC on the server.
// =============================================================================

import { authRouter } from "./routers/auth.js";
import { availabilityRouter } from "./routers/availability.js";
import { sessionsRouter } from "./routers/sessions.js";
import { sessionTypesRouter } from "./routers/sessionTypes.js";
import { statsRouter } from "./routers/stats.js";
import { suggestionsRouter } from "./routers/suggestions.js";
import { createTRPCRouter } from "./trpc.js";

// -----------------------------------------------------------------------------
// App Router Definition
// -----------------------------------------------------------------------------
// All sub-routers are merged here. The structure becomes:
// - trpc.auth.login()
// - trpc.sessionTypes.list()
// - trpc.availability.get()
// - trpc.sessions.create()
// - trpc.suggestions.getSuggestions()
// - trpc.stats.getStats()
// -----------------------------------------------------------------------------

export const appRouter = createTRPCRouter({
  auth: authRouter,
  sessionTypes: sessionTypesRouter,
  availability: availabilityRouter,
  sessions: sessionsRouter,
  suggestions: suggestionsRouter,
  stats: statsRouter,
});

// -----------------------------------------------------------------------------
// Type Export for Client
// -----------------------------------------------------------------------------
// This type is imported by the client to get full type inference.
// The client never imports the actual router, only this type.
// -----------------------------------------------------------------------------

export type AppRouter = typeof appRouter;

