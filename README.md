# Smart Session Planner

A full-stack mobile application for intelligent session scheduling and planning.

## Tech Stack

- **Mobile App:** Expo (React Native) + TypeScript + Tamagui
- **Backend API:** Next.js 16 App Router + tRPC
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT + bcrypt

## Project Structure

```text
├── apps/
│   ├── server/        # Next.js API server with tRPC
│   └── mobile/        # Expo mobile app
├── packages/
│   ├── api/           # tRPC routers and schemas
│   ├── database/      # Prisma schema and client
│   ├── eslint-config/ # Shared ESLint config
│   ├── typescript-config/ # Shared TS config
│   └── ui/            # Shared UI components
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10.11.0+ (see `packageManager` field in `package.json`)
- Docker and Docker Compose (for PostgreSQL database)
- Expo Go app (for mobile testing)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

Create a `.env` file in `apps/server/` directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_session_planner"
JWT_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"
```

**Note:** The `DATABASE_URL` above matches the default Docker Compose configuration. The API dev script will automatically start the PostgreSQL container.

**Optional:** For the mobile app, you can set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` if you need to connect to a different API URL (defaults to `http://localhost:3000`).

### 3. Setup Database

The API dev script automatically starts Docker Compose to run PostgreSQL. However, you need to generate the Prisma client and push the schema first:

```bash
cd apps/server
pnpm db:generate
pnpm db:push
```

**Note:** Make sure Docker is running before starting the API server. The dev script will handle starting the database container automatically.

### 4. Start Development

You have two options to start the development servers:

#### Option A: Run Both Apps Together (Recommended)

From the root directory, run both the API and mobile app in parallel:

```bash
pnpm dev
```

This will:

- Start the PostgreSQL database via Docker Compose (from the API dev script)
- Start the Next.js API server on `http://localhost:3000`
- Start the Expo development server for the mobile app

#### Option B: Run Apps Separately

**Start the API server:**

```bash
cd apps/server
pnpm dev
```

This command will:

- Automatically start Docker Compose to run PostgreSQL
- Kill any existing process on port 3000
- Start the Next.js API server on `http://localhost:3000`

**Start the mobile app** (in a separate terminal):

```bash
cd apps/mobile
pnpm start
```

The mobile app will connect to `http://localhost:3000` by default. Scan the QR code with Expo Go to run on your device.

## Features

### Session Types

- Create/edit/delete session types
- Priority levels (1-5) with color coding
- Track completed sessions per type

### User Availability

- Set weekly availability windows
- Define time slots per day of week
- Used by suggestion algorithm

### Smart Scheduling

- Create scheduled sessions
- View calendar with week navigation
- Conflict detection and warnings
- **Smart Suggestions**: AI-powered time slot recommendations based on:
  - User availability windows
  - Existing scheduled sessions
  - Session priority (high priority prefers mornings)
  - Fatigue heuristic (max 2 high-priority per day)
  - Spacing optimization

### Progress Tracking

- Completion rate statistics
- Current streak tracking
- Average sessions per week
- Breakdown by session type
- Total hours tracked

## API Endpoints (tRPC)

All endpoints are accessible via `/api/trpc`:

- `auth.register` / `auth.login` / `auth.me`
- `sessionTypes.list` / `.create` / `.update` / `.delete`
- `availability.get` / `.upsert` / `.delete`
- `sessions.list` / `.upcoming` / `.create` / `.update` / `.delete` / `.complete`
- `suggestions.getSuggestions`
- `stats.getStats`

## Mobile App Screens

- **Auth**: Login / Register
- **Dashboard**: Quick stats, upcoming sessions, quick actions
- **Schedule**: Calendar view with week navigation
- **Types**: Session type management
- **Profile**: Settings, availability, logout
- **Suggestions**: Smart scheduling recommendations
- **Stats**: Detailed analytics and progress

## Development

### Type Safety

tRPC provides end-to-end type safety. Changes to API shapes are immediately reflected in the mobile app with TypeScript errors.

### Database Migrations

```bash
cd apps/server
pnpm db:migrate    # Create migration
pnpm db:push       # Push schema changes (dev)
pnpm db:studio     # Open Prisma Studio
```

### Build

```bash
pnpm build  # Build all packages
```

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

## License

MIT
