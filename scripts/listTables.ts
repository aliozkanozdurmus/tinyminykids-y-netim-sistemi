import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

async function main() {
  const url = process.env.NEON_DB_URL;
  if (!url) {
    console.error('NEON_DB_URL not set in .env.local');
    process.exit(1);
  }
  console.log('Connecting to:', url);
  const pool = new Pool({ connectionString: url });
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Public tables:', result.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error querying tables:', err);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});