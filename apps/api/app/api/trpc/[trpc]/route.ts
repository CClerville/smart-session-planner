// =============================================================================
// tRPC API ROUTE HANDLER
// =============================================================================
// This is the single entry point for all tRPC requests.
// Next.js App Router catch-all route handles all tRPC procedures.
// =============================================================================

import { appRouter, verifyToken, type Context } from "@repo/api";
import { db } from "@repo/database";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// -----------------------------------------------------------------------------
// CORS Configuration
// -----------------------------------------------------------------------------
// Allows requests from Expo development server and localhost.
// -----------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  // Expo development origins
  /^https:\/\/.*\.exp\.direct$/,
  // Localhost development
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin");

  // Check if the origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));

  // Only return CORS headers for allowed origins
  if (!isAllowed) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

// -----------------------------------------------------------------------------
// Context Creation
// -----------------------------------------------------------------------------
// Creates the context for each tRPC request.
// Extracts and verifies JWT token from Authorization header.
// -----------------------------------------------------------------------------

async function createContext(req: Request): Promise<Context> {
  // Extract token from Authorization header
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  // Default context with no user
  let user: Context["user"] = null;

  // Verify token if present
  if (token) {
    const jwtSecret = process.env.JWT_SECRET;

    if (jwtSecret) {
      const payload = await verifyToken(token, jwtSecret);

      if (payload) {
        user = {
          id: payload.userId,
          email: payload.email,
        };
      }
    }
  }

  return { db, user };
}

// -----------------------------------------------------------------------------
// Request Handler
// -----------------------------------------------------------------------------
// Handles both GET and POST requests for tRPC.
// GET is used for queries, POST for mutations and batched requests.
// -----------------------------------------------------------------------------

async function handler(req: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(req);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),

    // Error handling - log errors in development
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? "unknown"}:`, error);
          }
        : undefined,
  });

  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// -----------------------------------------------------------------------------
// OPTIONS Handler (CORS Preflight)
// -----------------------------------------------------------------------------

async function optionsHandler(req: Request): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

// Export handlers for all HTTP methods
export { handler as GET, optionsHandler as OPTIONS, handler as POST };

