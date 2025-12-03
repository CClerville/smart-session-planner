# Architecture

## Overview

Turborepo monorepo: Expo mobile client + Next.js API server with end-to-end type safety via tRPC.

## Structure

```
apps/
  mobile/     # Expo/React Native (Tamagui UI, Expo Router)
  server/     # Next.js API server (tRPC endpoints)

packages/
  api/        # tRPC router definitions (shared types)
  database/   # Prisma client + schema (PostgreSQL)
  ui/         # Shared UI components
  *-config/   # Shared ESLint/TypeScript configs
```

## Data Flow

```
Mobile App
    ↓
tRPC Client (@trpc/react-query)
    ↓
Next.js API Route (/api/trpc/[trpc])
    ↓
tRPC Router (packages/api)
    ↓
Prisma Client
    ↓
PostgreSQL (Docker)
```

## Key Tech Choices

| Layer | Tech | Why |
|-------|------|-----|
| API | tRPC | End-to-end type safety, no codegen |
| Data Fetching | React Query | Cache, optimistic updates, mutations |
| Database | Prisma + PostgreSQL | Type-safe ORM, migrations |
| Mobile UI | Tamagui | Cross-platform, performant |
| Routing | Expo Router | File-based, native navigation |
| Monorepo | Turborepo + pnpm | Fast builds, workspace deps |

## Domain Model

- **User** - Auth entity. All data scoped via `userId`.
- **SessionType** - Category template (e.g., "Deep Work", "Exercise"). Has priority, color, icon.
- **Session** - Scheduled time block. Links to SessionType. Status: SCHEDULED | COMPLETED | CANCELLED.
- **Availability** - Weekly recurring time windows (day + start/end time).
- **UserPreferences** - Algorithm tuning (max daily minutes, buffer between sessions, morning preference).

## Local Development

```bash
pnpm install
pnpm dev          # Starts server + mobile (Turbo parallel)
```

Server auto-starts PostgreSQL via Docker Compose.
