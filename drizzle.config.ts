// @ts-nocheck
// Drizzle ORM configuration for Neon Postgres migrations
import 'dotenv/config';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.NEON_DB_URL!,
  },
} as any;