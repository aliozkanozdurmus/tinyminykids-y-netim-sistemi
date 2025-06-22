import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';

console.log('Drizzle connecting to:', process.env.NEON_DB_URL);
const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
});
pool.on('connect', () => console.log('Pool connected'));
pool.on('error', err => console.error('Pool error', err));

export const db = drizzle(pool, { schema });
console.log('Drizzle ORM initialized with schema tables:', Object.keys(schema));