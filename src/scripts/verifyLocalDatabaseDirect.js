import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verifying Local PostgreSQL Database...\n');

// Database connection configuration
const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'ignite_rewards',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || 'Maegan@200328',
};

console.log(`Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const client = new Client(dbConfig);

async function verifyLocalDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database successfully\n');

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

    console.log('📋 Checking Tables...\n');

    // Check if tables exist and have data
    for (const table of requiredTables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [table]);

        const exists = parseInt(result.rows[0].count) > 0;

        if (exists) {
          // Check if table has data
          const dataResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          const recordCount = parseInt(dataResult.rows[0].count);
          
          console.log(`✅ Table '${table}': EXISTS (${recordCount} records)`);
          
          if (recordCount === 0) {
            console.log(`   ⚠️  Warning: Table '${table}' is empty`);
            allDataExists = false;
          }
        } else {
          console.log(`❌ Table '${table}': NOT FOUND`);
          allTablesExist = false;
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ERROR - ${err.message}`);
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
        const result = await client.query(`SELECT COUNT(*) as count FROM ${check.table}`);
        const count = parseInt(result.rows[0].count);
        
        console.log(`✅ ${check.name}: ${count} records`);
        
        if (count === 0) {
          console.log(`   ⚠️  Warning: ${check.name} table is empty`);
          allDataExists = false;
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
      console.log('1. Run the setup script: psql -d ignite_rewards -f src/sql/setup_local_database.sql');
    }

    console.log('\n' + '='.repeat(50));

  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your database credentials in .env.local');
    console.log('3. Verify the database "ignite_rewards" exists');
  } finally {
    await client.end();
  }
}

// Run verification
verifyLocalDatabase();
