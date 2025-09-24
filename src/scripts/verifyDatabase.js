import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Database Configuration...\n');

  const requiredTables = [
    'referral_campaigns',
    'user_wallets', 
    'point_release_delays',
    'loyalty_networks',
    'asset_initiatives',
    'merchant_custom_nfts',
    'discount_codes',
    'admin_feature_controls',
    'loyalty_otp_codes',
    'email_notifications',
    'ecommerce_webhooks'
  ];

  let allTablesExist = true;
  let allDataExists = true;

  // Check if tables exist and have data
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}': EXISTS (${count || 0} records)`);
        if (count === 0) {
          console.log(`   ⚠️  Warning: Table '${table}' is empty`);
          allDataExists = false;
        }
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
      allTablesExist = false;
    }
  }

  console.log('\n📊 Checking Default Data...\n');

  // Check specific default data
  const dataChecks = [
    { table: 'referral_campaigns', name: 'Referral Campaigns' },
    { table: 'loyalty_networks', name: 'Loyalty Networks' },
    { table: 'asset_initiatives', name: 'Asset Initiatives' },
    { table: 'admin_feature_controls', name: 'Feature Controls' }
  ];

  for (const check of dataChecks) {
    try {
      const { data, error, count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`❌ ${check.name}: ${error.message}`);
        allDataExists = false;
      } else {
        console.log(`✅ ${check.name}: ${count || 0} records`);
        if (count === 0) {
          console.log(`   ⚠️  Warning: ${check.name} table is empty`);
          allDataExists = false;
        }
      }
    } catch (err) {
      console.log(`❌ ${check.name}: ${err.message}`);
      allDataExists = false;
    }
  }

  console.log('\n🔧 Checking Database Functions...\n');

  // Check if we can perform basic operations
  try {
    // Test referral campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('referral_campaigns')
      .select('*')
      .limit(1);

    if (campaignError) {
      console.log(`❌ Referral Campaigns Query: ${campaignError.message}`);
    } else {
      console.log(`✅ Referral Campaigns Query: Working`);
    }

    // Test loyalty networks
    const { data: networks, error: networkError } = await supabase
      .from('loyalty_networks')
      .select('*')
      .limit(1);

    if (networkError) {
      console.log(`❌ Loyalty Networks Query: ${networkError.message}`);
    } else {
      console.log(`✅ Loyalty Networks Query: Working`);
    }

  } catch (err) {
    console.log(`❌ Database Query Test: ${err.message}`);
  }

  console.log('\n📋 VERIFICATION SUMMARY\n');
  console.log('='.repeat(50));

  if (allTablesExist && allDataExists) {
    console.log('🎉 DATABASE CONFIGURATION: ✅ COMPLETE');
    console.log('✅ All required tables exist');
    console.log('✅ Default data has been inserted');
    console.log('✅ Database is ready for production');
  } else {
    console.log('⚠️  DATABASE CONFIGURATION: ❌ INCOMPLETE');
    if (!allTablesExist) {
      console.log('❌ Some required tables are missing');
    }
    if (!allDataExists) {
      console.log('❌ Some tables are missing default data');
    }
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Run the table creation script: src/sql/01_create_missing_tables.sql');
    console.log('2. Run the default data script: src/sql/02_insert_default_data.sql');
  }

  console.log('\n' + '='.repeat(50));
}

// Run verification
verifyDatabase().catch(console.error);
