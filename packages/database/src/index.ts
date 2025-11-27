// =============================================================================
// DATABASE PACKAGE - Entry Point
// =============================================================================
// Exports a singleton Prisma client instance for use across the application.
// This ensures only one database connection pool is created.
// =============================================================================

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

// -----------------------------------------------------------------------------
// PostgreSQL Connection Pool
// -----------------------------------------------------------------------------
// Create a connection pool for the PostgreSQL adapter.
// -----------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// -----------------------------------------------------------------------------
// Singleton Pattern for Prisma Client
// -----------------------------------------------------------------------------
// In development, Next.js hot reloading can create multiple Prisma instances.
// We store the client on globalThis to prevent connection pool exhaustion.
// In production, this simply creates a single instance.
// -----------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client instance.
 * Use this throughout the application for all database operations.
 */
export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Log queries in development for debugging
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Preserve the client across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// -----------------------------------------------------------------------------
// Re-export Prisma types for convenience
// -----------------------------------------------------------------------------
// This allows consumers to import types directly from @repo/database
// instead of importing from @prisma/client separately.
// -----------------------------------------------------------------------------

export * from "@prisma/client";

