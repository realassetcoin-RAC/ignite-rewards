// Test Local Database Connection
// This script tests if the local PostgreSQL database is accessible

import { Client } from 'pg';

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function testLocalConnection() {
  console.log('🔍 Testing local PostgreSQL database connection...\n');

  const client = new Client(dbConfig);

  try {
    // Connect to local database
    console.log('🔌 Connecting to local PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to local database successfully\n');

    // Test subscription plans table
    console.log('📊 Testing merchant_subscription_plans table...');
    const plansResult = await client.query(`
      SELECT 
        plan_name, 
        plan_number, 
        email_limit, 
        monthly_points, 
        monthly_transactions,
        is_popular
      FROM public.merchant_subscription_plans
      ORDER BY plan_number;
    `);

    console.log(`✅ Found ${plansResult.rows.length} subscription plans:`);
    plansResult.rows.forEach(plan => {
      console.log(`   - ${plan.plan_name}: Plan #${plan.plan_number}, ${plan.monthly_points} points, ${plan.monthly_transactions} txns, ${plan.email_limit} emails`);
    });

    // Test MFA function
    console.log('\n🔐 Testing can_use_mfa function...');
    const mfaResult = await client.query(`
      SELECT public.can_use_mfa('00000000-0000-0000-0000-000000000000'::UUID) as mfa_test;
    `);
    console.log(`✅ MFA Function: Working (test result: ${mfaResult.rows[0].mfa_test})`);

    // Test issue categories
    console.log('\n📋 Testing issue_categories table...');
    const categoriesResult = await client.query(`
      SELECT COUNT(*) as count FROM public.issue_categories;
    `);
    console.log(`✅ Issue Categories: ${categoriesResult.rows[0].count} categories available`);

    console.log('\n🎉 All local database tests passed!');
    console.log('✅ Local PostgreSQL database is working correctly');
    console.log('🚀 Ready for application testing!');

  } catch (error) {
    console.error('❌ Error testing local database:', error);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from local database');
  }
}

// Run the test
testLocalConnection().catch(console.error);
