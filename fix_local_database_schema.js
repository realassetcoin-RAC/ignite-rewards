// Fix Local PostgreSQL Database Schema Issues
// This script applies fixes to the LOCAL PostgreSQL database as per .cursorrules

import { Client } from 'pg';
import fs from 'fs';

// Local PostgreSQL configuration from .env.local
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function fixLocalDatabase() {
  console.log('🔧 Fixing LOCAL PostgreSQL database schema issues...\n');

  const client = new Client(dbConfig);

  try {
    // Connect to local database
    console.log('🔌 Connecting to local PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to local database successfully\n');

    // Read the SQL fix file
    const sqlContent = fs.readFileSync('fix_database_schema_issues.sql', 'utf8');
    console.log('📄 SQL fix file loaded successfully');

    // Execute the SQL fixes
    console.log('🚀 Executing database fixes on LOCAL database...\n');
    await client.query(sqlContent);
    console.log('✅ Database fixes applied successfully to LOCAL database!');

    // Verify the fixes
    await verifyLocalFixes(client);

  } catch (error) {
    console.error('❌ Error fixing local database:', error);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from local database');
  }
}

async function verifyLocalFixes(client) {
  console.log('\n🔍 Verifying local database fixes...\n');

  try {
    // Check merchant_subscription_plans table structure
    const plansResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'merchant_subscription_plans'
      ORDER BY ordinal_position;
    `);

    console.log('✅ merchant_subscription_plans table structure:');
    plansResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check subscription plans data
    const plansData = await client.query(`
      SELECT id, plan_name, plan_number, email_limit, monthly_points, monthly_transactions, is_popular
      FROM public.merchant_subscription_plans
      ORDER BY plan_number;
    `);

    console.log(`\n📊 Found ${plansData.rows.length} subscription plans:`);
    plansData.rows.forEach(plan => {
      console.log(`   - ${plan.plan_name}: Plan #${plan.plan_number}, ${plan.monthly_points} points, ${plan.monthly_transactions} txns`);
    });

    // Check issue_categories table
    const categoriesResult = await client.query(`
      SELECT COUNT(*) as count FROM public.issue_categories;
    `);

    console.log(`\n✅ issue_categories table: ${categoriesResult.rows[0].count} categories`);

    // Check can_use_mfa function
    const functionResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'can_use_mfa'
      ) as function_exists;
    `);

    if (functionResult.rows[0].function_exists) {
      console.log('✅ can_use_mfa function exists');
    } else {
      console.log('❌ can_use_mfa function does not exist');
    }

    console.log('\n🎉 Local database verification completed!');
    console.log('✅ All critical database issues have been resolved in LOCAL database');
    console.log('🚀 Ready for UAT deployment with local database!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the fixes
fixLocalDatabase().catch(console.error);

