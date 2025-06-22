// @ts-nocheck
// Drizzle ORM configuration for Neon Postgres migrations
import { config } from 'dotenv';
config({ path: '.env.local' });

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  url: process.env.NEON_DB_URL!,
} as any;