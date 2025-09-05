#!/usr/bin/env node
/*
 * Simple SQL runner for Postgres (Supabase) using pg.
 * Usage:
 *   DATABASE_URL=postgresql://user:pass@host:5432/db node scripts/run-sql.cjs /absolute/path/to/file.sql
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlFilePath = process.argv[2] || '/workspace/fix_referrals_subscription_schema.sql';
  const databaseUrl = process.env.DATABASE_URL || '';

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }
  if (databaseUrl.includes('[YOUR-PASSWORD]')) {
    console.error('Error: DATABASE_URL contains a placeholder password. Please provide the actual password.');
    process.exit(1);
  }

  const resolved = path.resolve(sqlFilePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: SQL file not found at ${resolved}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(resolved, 'utf8');

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    console.log(`Connecting to database...`);
    await client.connect();
    console.log(`Running SQL from ${resolved}...`);
    await client.query(sql);
    console.log('✅ SQL executed successfully');

    // Minimal verification
    const verifyQueries = [
      `SELECT 'user_referrals' AS table, COUNT(*)::text AS count FROM public.user_referrals`,
      `SELECT 'merchant_subscription_plans' AS table, COUNT(*)::text AS count FROM public.merchant_subscription_plans`,
      `SELECT 'referral_campaigns' AS table, COUNT(*)::text AS count FROM public.referral_campaigns`
    ];
    for (const q of verifyQueries) {
      try {
        const { rows } = await client.query(q);
        console.log(rows[0]);
      } catch (e) {
        console.warn('Verification query failed:', e.message);
      }
    }
  } catch (err) {
    console.error('❌ SQL execution failed:', err.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});

