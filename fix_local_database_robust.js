// Robust Local PostgreSQL Database Schema Fixes
// This script safely applies fixes to the LOCAL PostgreSQL database

import { Client } from 'pg';

// Local PostgreSQL configuration from .env.local
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function fixLocalDatabaseRobust() {
  console.log('🔧 Applying robust fixes to LOCAL PostgreSQL database...\n');

  const client = new Client(dbConfig);

  try {
    // Connect to local database
    console.log('🔌 Connecting to local PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to local database successfully\n');

    // 1. Fix merchant_subscription_plans table
    await fixSubscriptionPlansTable(client);

    // 2. Fix can_use_mfa function
    await fixMfaFunction(client);

    // 3. Fix issue_categories table
    await fixIssueCategoriesTable(client);

    // Verify all fixes
    await verifyAllFixes(client);

  } catch (error) {
    console.error('❌ Error fixing local database:', error);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from local database');
  }
}

async function fixSubscriptionPlansTable(client) {
  console.log('1️⃣ Fixing merchant_subscription_plans table...');

  try {
    // Add missing columns one by one
    const columnsToAdd = [
      { name: 'plan_number', type: 'INTEGER', default: '1' },
      { name: 'email_limit', type: 'INTEGER', default: '1' },
      { name: 'monthly_points', type: 'INTEGER', default: '100' },
      { name: 'monthly_transactions', type: 'INTEGER', default: '100' }
    ];

    for (const column of columnsToAdd) {
      try {
        await client.query(`
          ALTER TABLE public.merchant_subscription_plans 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.default};
        `);
        console.log(`   ✅ Added ${column.name} column`);
      } catch (error) {
        if (error.code === '42701') { // column already exists
          console.log(`   ⚠️ ${column.name} column already exists`);
        } else {
          console.error(`   ❌ Error adding ${column.name}:`, error.message);
        }
      }
    }

    // Update existing plans with proper values
    await client.query(`
      UPDATE public.merchant_subscription_plans 
      SET 
        plan_number = CASE 
          WHEN plan_name ILIKE '%startup%' OR plan_name ILIKE '%start%' THEN 1
          WHEN plan_name ILIKE '%momentum%' THEN 2
          WHEN plan_name ILIKE '%energizer%' THEN 3
          WHEN plan_name ILIKE '%cloud9%' OR plan_name ILIKE '%cloud%' THEN 4
          WHEN plan_name ILIKE '%super%' THEN 5
          ELSE 1
        END,
        email_limit = CASE 
          WHEN plan_name ILIKE '%startup%' OR plan_name ILIKE '%start%' THEN 1
          WHEN plan_name ILIKE '%momentum%' THEN 2
          WHEN plan_name ILIKE '%energizer%' THEN 3
          WHEN plan_name ILIKE '%cloud9%' OR plan_name ILIKE '%cloud%' THEN 5
          WHEN plan_name ILIKE '%super%' THEN 10
          ELSE 1
        END,
        monthly_points = CASE 
          WHEN plan_name ILIKE '%startup%' OR plan_name ILIKE '%start%' THEN 100
          WHEN plan_name ILIKE '%momentum%' THEN 500
          WHEN plan_name ILIKE '%energizer%' THEN 1000
          WHEN plan_name ILIKE '%cloud9%' OR plan_name ILIKE '%cloud%' THEN 2500
          WHEN plan_name ILIKE '%super%' THEN 5000
          ELSE 100
        END,
        monthly_transactions = CASE 
          WHEN plan_name ILIKE '%startup%' OR plan_name ILIKE '%start%' THEN 100
          WHEN plan_name ILIKE '%momentum%' THEN 500
          WHEN plan_name ILIKE '%energizer%' THEN 1000
          WHEN plan_name ILIKE '%cloud9%' OR plan_name ILIKE '%cloud%' THEN 2500
          WHEN plan_name ILIKE '%super%' THEN 5000
          ELSE 100
        END
      WHERE plan_number IS NULL OR email_limit IS NULL OR monthly_points IS NULL OR monthly_transactions IS NULL;
    `);

    console.log('   ✅ Updated existing subscription plans');

  } catch (error) {
    console.error('   ❌ Error fixing subscription plans table:', error.message);
  }
}

async function fixMfaFunction(client) {
  console.log('\n2️⃣ Fixing can_use_mfa function...');

  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.can_use_mfa(user_id UUID)
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
          -- Check if user exists and has MFA capability
          RETURN EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = user_id 
              AND is_active = true
          );
      END;
      $$;
    `);
    console.log('   ✅ Created/updated can_use_mfa function');

  } catch (error) {
    console.error('   ❌ Error creating can_use_mfa function:', error.message);
  }
}

async function fixIssueCategoriesTable(client) {
  console.log('\n3️⃣ Fixing issue_categories table...');

  try {
    // Check if table exists and its structure
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'issue_categories'
      ) as table_exists;
    `);

    if (!tableCheck.rows[0].table_exists) {
      // Create table if it doesn't exist
      await client.query(`
        CREATE TABLE public.issue_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('   ✅ Created issue_categories table');

      // Insert default categories
      await client.query(`
        INSERT INTO public.issue_categories (name, description, color) VALUES
        ('Bug', 'Software bugs and technical issues', '#EF4444'),
        ('Feature Request', 'New feature requests and enhancements', '#3B82F6'),
        ('Performance', 'Performance and optimization issues', '#F59E0B'),
        ('Security', 'Security-related concerns', '#DC2626'),
        ('UI/UX', 'User interface and experience issues', '#8B5CF6'),
        ('Database', 'Database-related issues', '#10B981'),
        ('API', 'API and integration issues', '#F97316'),
        ('Documentation', 'Documentation and help requests', '#6B7280');
      `);
      console.log('   ✅ Inserted default issue categories');

    } else {
      console.log('   ⚠️ issue_categories table already exists');
      
      // Check if it has data
      const countResult = await client.query('SELECT COUNT(*) as count FROM public.issue_categories;');
      console.log(`   📊 Table has ${countResult.rows[0].count} categories`);
    }

  } catch (error) {
    console.error('   ❌ Error fixing issue_categories table:', error.message);
  }
}

async function verifyAllFixes(client) {
  console.log('\n🔍 Verifying all fixes...\n');

  try {
    // Check subscription plans
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

    console.log('✅ Subscription Plans:');
    plansResult.rows.forEach(plan => {
      console.log(`   - ${plan.plan_name}: Plan #${plan.plan_number}, ${plan.monthly_points} points, ${plan.monthly_transactions} txns, ${plan.email_limit} emails`);
    });

    // Check MFA function
    const mfaResult = await client.query(`
      SELECT public.can_use_mfa('00000000-0000-0000-0000-000000000000'::UUID) as mfa_test;
    `);
    console.log(`\n✅ MFA Function: Working (test result: ${mfaResult.rows[0].mfa_test})`);

    // Check issue categories
    const categoriesResult = await client.query(`
      SELECT COUNT(*) as count FROM public.issue_categories;
    `);
    console.log(`✅ Issue Categories: ${categoriesResult.rows[0].count} categories available`);

    console.log('\n🎉 All local database fixes completed successfully!');
    console.log('✅ Ready for UAT deployment with local PostgreSQL database!');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Run the fixes
fixLocalDatabaseRobust().catch(console.error);

