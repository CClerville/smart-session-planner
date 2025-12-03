# Smart Session Planner

A full-stack mobile application for intelligent session scheduling and planning.

## Tech Stack

### Mobile App

- **Framework**: Expo ~54.0.25 (React Native 0.81.5)
- **Language**: TypeScript 5.9+
- **UI Library**: Tamagui 1.121.10 (cross-platform design system)
- **Navigation**: Expo Router 6.0.15 (file-based routing)
- **State Management**: TanStack Query (React Query) 5.80.6
- **API Client**: tRPC Client 11.1.2
- **Storage**: Expo SecureStore (encrypted token storage), AsyncStorage (user data)
- **Serialization**: superjson 2.2.2 (for date handling)

### Backend API

- **Framework**: Next.js 15.3.3 (App Router)
- **API Layer**: tRPC Server 11.1.2
- **Language**: TypeScript 5.9.2
- **Serialization**: superjson 2.2.2

### Database

- **Database**: PostgreSQL 16 (via Docker)
- **ORM**: Prisma 7.0.0
- **Schema Location**: `packages/database/prisma/schema.prisma`

### Authentication

- **JWT**: jose 6.0.11 (token creation/verification)
- **Password Hashing**: bcrypt 6.0.0 (12 salt rounds)

### Monorepo

- **Build System**: Turborepo (task orchestration)
- **Package Manager**: pnpm 10.11.0
- **Node Version**: 22+
- **React Version**: 19.1.0 (overridden in root package.json)

## Architecture

### Overview

This is a **Turborepo monorepo** that provides end-to-end type safety between a mobile client and API server using tRPC. The architecture follows a feature-based structure on the mobile app and a router-based structure on the API.

### Data Flow

```text
Mobile App (Expo)
    ↓
tRPC Client (@trpc/react-query)
    ↓
HTTP Request (Authorization: Bearer <token>)
    ↓
Next.js API Route (/api/trpc/[trpc])
    ↓
tRPC Router (packages/api)
    ↓
Prisma Client (@repo/database)
    ↓
PostgreSQL (Docker Container)
```

### Authentication Flow

1. User registers/logs in via `auth.register` or `auth.login`

2. Server returns JWT token (expires after 7 days)
3. Mobile app stores token in Expo SecureStore (encrypted)
4. All subsequent requests include token in `Authorization: Bearer <token>` header
5. Server verifies token using `jose` library
6. User data is cached in AsyncStorage for optimistic UI updates

### Type Safety

- **End-to-end**: tRPC provides full type inference from server to client

- **No codegen**: Types are inferred automatically, no separate generation step
- **React Query Integration**: Type-safe hooks via `@trpc/react-query`
- **Zod Schemas**: Input validation on both client and server

## Project Structure

```text
smart-session-planner/
├── apps/
│   ├── server/                    # Next.js API server
│   │   ├── app/
│   │   │   └── api/trpc/[trpc]/   # tRPC route handler
│   │   ├── package.json
│   │   └── .env                   # DATABASE_URL, JWT_SECRET
│   │
│   └── mobile/                    # Expo mobile app
│       ├── app/                   # Expo Router file-based routes
│       │   ├── (auth)/            # Auth screens (login, register)
│       │   ├── (tabs)/            # Tab navigation (home, schedule, stats, profile)
│       │   ├── session/           # Session modals (new, detail)
│       │   ├── availability.tsx   # Availability modal
│       │   ├── suggestions.tsx   # Suggestions modal
│       │   └── _layout.tsx        # Root layout with providers
│       │
│       ├── src/
│       │   ├── features/          # Feature-based organization
│       │   │   ├── auth/          # Authentication
│       │   │   ├── dashboard/     # Home dashboard
│       │   │   ├── schedule/      # Calendar view
│       │   │   ├── sessions/      # Session management
│       │   │   ├── session-types/ # Session type CRUD
│       │   │   ├── availability/  # Availability management
│       │   │   ├── suggestions/   # Smart suggestions
│       │   │   ├── stats/         # Analytics and stats
│       │   │   └── profile/       # User settings
│       │   │
│       │   ├── lib/
│       │   │   ├── api/           # tRPC client setup
│       │   │   ├── providers/     # React providers (Auth, TRPC)
│       │   │   └── storage/       # SecureStore wrapper
│       │   │
│       │   └── constants/         # App constants
│       │
│       ├── lib/                   # Legacy lib (being migrated)
│       └── package.json
│
├── packages/
│   ├── api/                       # tRPC API package
│   │   ├── src/
│   │   │   ├── routers/           # tRPC routers
│   │   │   │   ├── auth.ts        # register, login, me
│   │   │   │   ├── sessionTypes.ts # list, create, update, delete
│   │   │   │   ├── availability.ts # get, upsert, delete
│   │   │   │   ├── sessions.ts    # list, upcoming, create, update, delete, complete
│   │   │   │   ├── suggestions.ts # getSuggestions
│   │   │   │   ├── stats.ts       # getStats
│   │   │   │   └── userPreferences.ts # get, upsert
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts        # JWT utilities
│   │   │   │   └── schemas.ts     # Zod validation schemas
│   │   │   ├── trpc.ts            # tRPC setup (context, procedures)
│   │   │   └── root.ts            # App router export
│   │   └── package.json
│   │
│   ├── database/                  # Prisma database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── migrations/        # Migration history
│   │   ├── src/
│   │   │   └── index.ts           # Prisma client export
│   │   └── package.json
│   │
│   ├── ui/                        # Shared UI components
│   ├── eslint-config/             # Shared ESLint configs
│   └── typescript-config/         # Shared TypeScript configs
│
├── docker-compose.yml             # PostgreSQL container config
├── turbo.json                     # Turborepo config
├── pnpm-workspace.yaml            # pnpm workspace config
└── package.json                   # Root package.json
```

### Mobile App Routing Structure

- **`(auth)/`**: Authentication screens (login, register) - Stack navigation
- **`(tabs)/`**: Main app screens with bottom tab navigation:
  - `index` - Dashboard/Home
  - `schedule` - Calendar view
  - `stats` - Statistics and analytics
  - `profile` - Settings and preferences
- **Modal Routes** (outside tabs):
  - `session/new` - Create new session
  - `session/[id]` - Session detail view
  - `availability` - Manage weekly availability
  - `suggestions` - View smart suggestions

## Getting Started

### Prerequisites

- **Node.js**: 22+ (see `engines.node` in root `package.json`)
- **pnpm**: 10.11.0+ (see `packageManager` field in root `package.json`)
- **Docker**: Desktop or Docker daemon (for PostgreSQL)
- **Expo Go**: Mobile app for testing (iOS/Android)

### 1. Install Dependencies

From the root directory:

```bash
pnpm install
```

This installs dependencies for all workspace packages using pnpm workspaces. The workspace includes:

- Root dependencies (Turborepo, Prettier, TypeScript)
- App dependencies (`apps/server`, `apps/mobile`)
- Package dependencies (`packages/api`, `packages/database`, etc.)

**Note**: React 19.1.0 is overridden in the root `package.json` to ensure consistent versions across the monorepo.

### 2. Setup Environment Variables

#### Server Environment (`apps/server/.env`)

Create a `.env` file in `apps/server/`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_session_planner"
JWT_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"
```

**Generate JWT Secret**:

```bash
openssl rand -base64 32
```

**Note**: The `DATABASE_URL` matches the default Docker Compose configuration. The API dev script automatically starts the PostgreSQL container.

#### Mobile App Environment (Optional)

Create `apps/mobile/.env` if you need to override the API URL:

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

For physical device testing, use your computer's local IP:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.XXX:3000"
```

### 3. Setup Database

The API dev script automatically starts Docker Compose, but you need to initialize the database schema first:

```bash
cd apps/server
pnpm db:generate  # Generate Prisma Client
pnpm db:push       # Push schema to database (creates tables)
```

**Alternative**: Use migrations for production:

```bash
pnpm db:migrate    # Create and apply migration
```

**Note**: Make sure Docker is running before executing these commands. The dev script handles starting the container automatically.

### 4. Start Development

#### Option A: Run Both Apps Together (Recommended)

From the root directory, Turborepo will run both apps in parallel:

```bash
pnpm dev
```

This command:

- Starts PostgreSQL via Docker Compose (from the server dev script)
- Starts the Next.js API server on `http://localhost:3000`
- Starts the Expo development server for the mobile app

Turborepo handles task orchestration and caching automatically.

#### Option B: Run Apps Separately

**Start the API server:**

```bash
cd apps/server
pnpm dev
```

This command:

- Automatically starts Docker Compose to run PostgreSQL
- Kills any existing process on port 3000
- Starts the Next.js API server on `http://localhost:3000`

**Start the mobile app** (in a separate terminal):

```bash
cd apps/mobile
pnpm start
```

The mobile app will connect to `http://localhost:3000` by default. Scan the QR code with Expo Go to run on your device.

**Platform-specific commands**:

```bash
pnpm ios      # Start iOS simulator
pnpm android  # Start Android emulator
```

## Features

### User Authentication

- **Registration**: Create account with email and password
- **Login**: Authenticate with email/password
- **JWT Tokens**: Stateless authentication (7-day expiration)
- **Secure Storage**: Tokens stored in Expo SecureStore (encrypted)
- **Optimistic UI**: User data cached for instant loading

### Session Types

- **CRUD Operations**: Create, read, update, delete session types
- **Priority Levels**: 1-5 scale (Very Low to Critical)
- **Customization**: Color coding and icon selection (Ionicons)
- **Category Grouping**: Optional category field for organization
- **Completion Tracking**: Count of completed sessions per type

### User Availability

- **Weekly Windows**: Define recurring availability per day of week
- **Time Slots**: Set start/end times in 24-hour format (HH:MM)
- **Batch Updates**: Upsert multiple availability windows at once
- **Suggestion Integration**: Used by smart scheduling algorithm

### Smart Scheduling

- **Session Management**: Create, update, delete scheduled sessions
- **Conflict Detection**: Automatic detection of overlapping sessions
- **Status Tracking**: SCHEDULED, COMPLETED, CANCELLED
- **Calendar View**: Week navigation with visual session display
- **Upcoming Sessions**: Quick access to next scheduled sessions

### Smart Suggestions

AI-powered time slot recommendations based on:

- **User Availability**: Only suggests times within availability windows
- **Existing Sessions**: Avoids conflicts with scheduled sessions
- **Priority Optimization**: High-priority sessions (4-5) prefer morning hours (6 AM - 12 PM)
- **Fatigue Heuristic**: Maximum 2 high-priority sessions per day
- **Spacing Optimization**: Configurable buffer between sessions (default: 30 minutes)
- **Scoring Algorithm**: Multi-factor scoring system with reason explanations
- **Time Slot Generation**: 30-minute increments within availability windows
- **Maximum Suggestions**: Returns up to 10 suggestions per request

### User Preferences

Algorithm tuning settings (stored per user):

- **Max Daily Minutes**: Maximum session time per day (default: 480 = 8 hours)
- **Buffer Minutes**: Gap between sessions (default: 30 minutes)
- **Prefer Mornings**: Bonus scoring for morning slots on high-priority sessions (default: true)
- **Max High Priority Per Day**: Maximum priority 4-5 sessions per day (default: 2)

### Progress Tracking

Comprehensive analytics and statistics:

- **Completion Rate**: Percentage of completed vs. cancelled sessions
- **Current Streak**: Consecutive days with completed sessions
- **Average Sessions Per Week**: Weekly session frequency
- **Breakdown by Type**: Sessions completed per session type
- **Total Hours Tracked**: Cumulative session duration
- **Time Range**: Stats calculated for all-time or custom date ranges

## API Endpoints (tRPC)

All endpoints are accessible via `/api/trpc`. tRPC provides type-safe client/server communication.

### Authentication (`auth`)

- `auth.register` - Create new user account
- `auth.login` - Authenticate and receive JWT token
- `auth.me` - Get current authenticated user (protected)

### Session Types (`sessionTypes`)

- `sessionTypes.list` - Get all session types with completion counts
- `sessionTypes.create` - Create new session type
- `sessionTypes.update` - Update existing session type
- `sessionTypes.delete` - Delete session type (cascades to sessions)

### Availability (`availability`)

- `availability.get` - Get all availability windows for user
- `availability.upsert` - Create or update availability windows (batch)
- `availability.delete` - Delete availability window

### Sessions (`sessions`)

- `sessions.list` - List sessions with optional filters (date range, status, type)
- `sessions.upcoming` - Get upcoming scheduled sessions
- `sessions.create` - Create new session (with conflict detection)
- `sessions.update` - Update existing session
- `sessions.delete` - Delete session
- `sessions.complete` - Mark session as completed

### Suggestions (`suggestions`)

- `suggestions.getSuggestions` - Get smart time slot recommendations
  - Parameters: `sessionTypeId`, `durationMinutes`, `timezone`, `startDate`, `endDate`
  - Returns: Array of scored time slots with reasons

### Statistics (`stats`)

- `stats.getStats` - Get comprehensive session analytics
  - Returns: Completion rate, streak, averages, breakdowns, totals

### User Preferences (`userPreferences`)

- `userPreferences.get` - Get user preferences (returns defaults if not set)
- `userPreferences.upsert` - Create or update preferences

## Mobile App Screens

### Tab Navigation (Bottom Tabs)

- **Home** (`(tabs)/index`) - Dashboard with quick stats, upcoming sessions, and quick actions
- **Calendar** (`(tabs)/schedule`) - Week view calendar with session display and navigation
- **Stats** (`(tabs)/stats`) - Detailed analytics, progress bars, and session type breakdowns
- **Settings** (`(tabs)/profile`) - User profile, availability management, preferences, logout

### Authentication Screens (Stack)

- **Login** (`(auth)/login`) - Email/password login form
- **Register** (`(auth)/register`) - User registration form

### Modal Screens

- **New Session** (`session/new`) - Create new scheduled session with type selection and conflict warnings
- **Session Detail** (`session/[id]`) - View/edit/complete/delete individual session
- **Availability** (`availability`) - Manage weekly availability windows
- **Suggestions** (`suggestions`) - Browse and accept smart scheduling recommendations

## Development

### Type Safety in Development

tRPC provides end-to-end type safety:

- **No Codegen**: Types are inferred automatically from server routers
- **Immediate Feedback**: Changes to API shapes trigger TypeScript errors in mobile app
- **React Query Integration**: Type-safe hooks via `@trpc/react-query`
- **Zod Validation**: Input validation schemas shared between client and server

### Workspace Dependencies

The monorepo uses pnpm workspaces:

- `@repo/api` - Shared tRPC routers and types
- `@repo/database` - Prisma client
- `@repo/eslint-config` - Shared ESLint configurations
- `@repo/typescript-config` - Shared TypeScript configurations
- `@repo/ui` - Shared UI components (if used)

### Database Migrations

```bash
cd apps/server

# Development: Push schema changes directly
pnpm db:push

# Production: Create migration
pnpm db:migrate

# Generate Prisma Client (after schema changes)
pnpm db:generate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

**Note**: Prisma schema is located at `packages/database/prisma/schema.prisma`. The database package exports the Prisma client for use in the API package.

### Build

Build all packages:

```bash
pnpm build
```

Turborepo handles:

- Dependency ordering (builds dependencies first)
- Caching (skips unchanged packages)
- Parallel execution where possible

### Type Checking

Check types across the monorepo:

```bash
pnpm check-types
```

### Linting

Lint all packages:

```bash
pnpm lint
```

### CORS Configuration

The API server includes CORS configuration for Expo development:

- Allows requests from Expo development origins (`*.exp.direct`)
- Allows localhost requests
- Handles preflight OPTIONS requests
- CORS headers are added conditionally based on origin

### Token Storage

- **Mobile**: Expo SecureStore (encrypted, platform-native secure storage)
- **Token Format**: JWT tokens stored as strings
- **User Data**: AsyncStorage (for optimistic UI, not sensitive)

### Date Serialization

- **superjson**: Used for serializing Date objects in tRPC requests/responses
- **Client**: Configured in tRPC client setup
- **Server**: Configured in tRPC server setup

## Troubleshooting

### Port 3000 Already in Use

If you get an error that port 3000 is already in use:

```bash
# Kill the process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or manually stop the process and restart
```

The API dev script automatically handles this, but if running manually, you may need to stop the existing process first.

### Docker Not Running

If you see database connection errors:

1. Make sure Docker Desktop (or Docker daemon) is running
2. Check if the container is running: `docker ps`
3. Start the container manually if needed:

   ```bash
   docker compose -f docker-compose.yml up -d
   ```

### Database Connection Issues

If you're having trouble connecting to the database:

1. Verify the `DATABASE_URL` in `apps/server/.env` matches the Docker Compose configuration:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_session_planner"
   ```

2. Check if the PostgreSQL container is running:

   ```bash
   docker ps | grep smart-session-db
   ```

3. View container logs if there are issues:

   ```bash
   docker logs smart-session-db
   ```

4. Reset the database if needed (⚠️ **WARNING:** This will delete all data):

   ```bash
   docker compose -f docker-compose.yml down -v
   docker compose -f docker-compose.yml up -d
   cd apps/server
   pnpm db:push
   ```

### Mobile App Can't Connect to API

If the mobile app can't reach the API:

1. Make sure the API server is running on `http://localhost:3000`
2. If testing on a physical device, ensure your device is on the same network
3. For physical devices, you may need to set `EXPO_PUBLIC_API_URL` to your computer's local IP address:

   ```env
   # In apps/mobile/.env
   EXPO_PUBLIC_API_URL="http://192.168.1.XXX:3000"
   ```

4. If using Expo Go, you can use the tunnel option: `pnpm start --tunnel`

### Prisma Client Not Generated

If you see "PrismaClient is not generated" errors:

```bash
cd apps/server
pnpm db:generate
```

This generates the Prisma Client from the schema. You need to run this after:

- Cloning the repository
- Pulling schema changes
- Updating the Prisma schema

## Assumptions and Limitations

### Assumptions

- **Authentication**:
  - JWT tokens expire after 7 days
  - Passwords are hashed with bcrypt (12 salt rounds)
  - Tokens stored securely in Expo SecureStore
- **Data Isolation**: All data is scoped per user (multi-tenant architecture)
- **Suggestion Algorithm**:
  - Morning hours are defined as 6 AM - 12 PM for the "prefer mornings" optimization
  - High-priority sessions are those with priority 4-5
  - Time slots are generated in 30-minute increments
  - Maximum of 10 suggestions returned per request
  - Default buffer between sessions: 30 minutes
  - Default max daily minutes: 480 (8 hours)
  - Default max high-priority per day: 2
- **Database**: Requires PostgreSQL 16+ (based on Docker image configuration)
- **User Preferences**: Created lazily on first access, defaults applied if not set

### Limitations

- **Mobile-only**: No web client available; requires Expo Go or a native build
- **No email verification**: Users can register with any email without verification
- **No password reset**: If a user forgets their password, there's no recovery flow
- **No social authentication**: Google, Apple, or other OAuth providers are not supported
- **No push notifications**: The app does not send reminders or alerts
- **No offline support**: Requires an active network connection to function
- **No recurring sessions**: Each session must be created individually; no repeat scheduling
- **No session sharing**: Sessions are private to each user; no collaboration features
- **Heuristic-based suggestions**: The scheduling algorithm uses rule-based heuristics, not machine learning
- **Single timezone per request**: Suggestions are calculated for one timezone at a time
- **No session notes editing**: Notes can be added on creation but editing is limited

## License

MIT
