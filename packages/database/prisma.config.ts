import { defineConfig } from 'prisma/config';

// Get DATABASE_URL from environment, with fallback to docker-compose default
// This allows the config to work even without a .env file
// Users can set DATABASE_URL in their environment or create a .env file
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_session_planner';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});

