import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// For local PostgreSQL, we'll use a local connection
// You'll need to update your .env file with local PostgreSQL credentials

const localDbUrl = process.env.VITE_DATABASE_URL || 'postgresql://postgres:Maegan@200328@localhost:5432/ignite_rewards';
const localDbKey = process.env.VITE_SUPABASE_ANON_KEY || 'local-development-key';

console.log('🔍 Verifying Local PostgreSQL Database...\n');

// Create client for local database
const supabase = createClient(localDbUrl, localDbKey);

async function verifyLocalDatabase() {
  console.log('🔌 Testing local database connection...');

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

  console.log('\n📋 VERIFICATION SUMMARY\n');
  console.log('='.repeat(50));

  if (allTablesExist && allDataExists) {
    console.log('🎉 LOCAL DATABASE CONFIGURATION: ✅ COMPLETE');
    console.log('✅ All required tables exist');
    console.log('✅ Default data has been inserted');
    console.log('✅ Local database is ready for development');
  } else {
    console.log('⚠️  LOCAL DATABASE CONFIGURATION: ❌ INCOMPLETE');
    if (!allTablesExist) {
      console.log('❌ Some required tables are missing');
    }
    if (!allDataExists) {
      console.log('❌ Some tables are missing default data');
    }
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Create the database: createdb rac_rewards');
    console.log('2. Run the setup script: psql -d rac_rewards -f src/sql/setup_local_database.sql');
  }

  console.log('\n' + '='.repeat(50));
}

// Run verification
verifyLocalDatabase().catch(console.error);
