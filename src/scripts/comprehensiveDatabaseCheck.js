import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 COMPREHENSIVE DATABASE VERIFICATION');
console.log('=====================================\n');

// Database connection configuration
const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'ignite_rewards',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || 'Maegan@200328',
};

const client = new Client(dbConfig);

// Required tables based on application requirements
const requiredTables = {
  // Core application tables
  'profiles': { required: true, description: 'User profiles and authentication' },
  'merchants': { required: true, description: 'Merchant information' },
  'loyalty_cards': { required: true, description: 'User loyalty cards' },
  'transactions': { required: true, description: 'Transaction records' },
  
  // New feature tables
  'referral_campaigns': { required: true, description: 'Referral campaign management' },
  'user_wallets': { required: true, description: 'User wallet information' },
  'point_release_delays': { required: true, description: '30-day point release system' },
  'loyalty_networks': { required: true, description: 'Third-party loyalty integrations' },
  'asset_initiatives': { required: true, description: 'Asset/initiative selection' },
  'merchant_custom_nfts': { required: true, description: 'Custom NFT management' },
  'discount_codes': { required: true, description: 'Discount code management' },
  'admin_feature_controls': { required: true, description: 'Feature control system' },
  'loyalty_otp_codes': { required: true, description: 'OTP management' },
  'email_notifications': { required: true, description: 'Email notification system' },
  'ecommerce_webhooks': { required: true, description: 'Ecommerce integration' },
  
  // Additional tables that might exist
  'referral_codes': { required: false, description: 'Referral code tracking' },
  'referral_settlements': { required: false, description: 'Referral settlement records' },
  'user_asset_selections': { required: false, description: 'User asset selections' },
  'subscription_plans': { required: false, description: 'Subscription plan management' },
  'merchant_subscriptions': { required: false, description: 'Merchant subscription records' }
};

async function comprehensiveCheck() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database successfully\n');

    let allChecksPassed = true;
    const results = {
      tables: { existing: 0, missing: 0, total: 0 },
      data: { withData: 0, empty: 0, total: 0 },
      constraints: { found: 0, missing: 0 },
      indexes: { found: 0, missing: 0 }
    };

    // 1. Check all required tables
    console.log('📋 1. TABLE EXISTENCE CHECK');
    console.log('==========================');
    
    for (const [tableName, config] of Object.entries(requiredTables)) {
      results.tables.total++;
      
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [tableName]);

        const exists = parseInt(result.rows[0].count) > 0;

        if (exists) {
          results.tables.existing++;
          console.log(`✅ ${tableName}: EXISTS ${config.required ? '(REQUIRED)' : '(OPTIONAL)'}`);
          console.log(`   📝 ${config.description}`);
          
          // Check if table has data
          const dataResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const recordCount = parseInt(dataResult.rows[0].count);
          results.data.total++;
          
          if (recordCount > 0) {
            results.data.withData++;
            console.log(`   📊 Records: ${recordCount}`);
          } else {
            results.data.empty++;
            console.log(`   📊 Records: 0 (empty)`);
          }
        } else {
          results.tables.missing++;
          if (config.required) {
            console.log(`❌ ${tableName}: MISSING (REQUIRED)`);
            console.log(`   📝 ${config.description}`);
            allChecksPassed = false;
          } else {
            console.log(`⚠️  ${tableName}: MISSING (OPTIONAL)`);
            console.log(`   📝 ${config.description}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ERROR - ${err.message}`);
        if (config.required) {
          allChecksPassed = false;
        }
      }
    }

    // 2. Check critical data requirements
    console.log('\n📊 2. CRITICAL DATA CHECK');
    console.log('=========================');
    
    const criticalDataChecks = [
      { table: 'referral_campaigns', minRecords: 1, description: 'At least one referral campaign' },
      { table: 'loyalty_networks', minRecords: 1, description: 'At least one loyalty network' },
      { table: 'asset_initiatives', minRecords: 1, description: 'At least one asset initiative' },
      { table: 'admin_feature_controls', minRecords: 1, description: 'At least one feature control' }
    ];

    for (const check of criticalDataChecks) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${check.table}`);
        const count = parseInt(result.rows[0].count);
        
        if (count >= check.minRecords) {
          console.log(`✅ ${check.table}: ${count} records (≥${check.minRecords} required)`);
        } else {
          console.log(`❌ ${check.table}: ${count} records (<${check.minRecords} required)`);
          console.log(`   📝 ${check.description}`);
          allChecksPassed = false;
        }
      } catch (err) {
        console.log(`❌ ${check.table}: ERROR - ${err.message}`);
        allChecksPassed = false;
      }
    }

    // 3. Check table structures and constraints
    console.log('\n🔧 3. TABLE STRUCTURE CHECK');
    console.log('============================');
    
    const structureChecks = [
      { table: 'referral_campaigns', requiredColumns: ['id', 'name', 'points_per_referral', 'max_referrals_per_user'] },
      { table: 'user_wallets', requiredColumns: ['id', 'user_id', 'wallet_address'] },
      { table: 'loyalty_networks', requiredColumns: ['id', 'network_name', 'display_name', 'conversion_rate'] },
      { table: 'asset_initiatives', requiredColumns: ['id', 'name', 'category'] },
      { table: 'admin_feature_controls', requiredColumns: ['id', 'feature_name', 'is_enabled', 'subscription_plans'] }
    ];

    for (const check of structureChecks) {
      try {
        const result = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [check.table]);

        const existingColumns = result.rows.map(row => row.column_name);
        const missingColumns = check.requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length === 0) {
          console.log(`✅ ${check.table}: All required columns present`);
        } else {
          console.log(`❌ ${check.table}: Missing columns: ${missingColumns.join(', ')}`);
          allChecksPassed = false;
        }
      } catch (err) {
        console.log(`❌ ${check.table}: ERROR - ${err.message}`);
        allChecksPassed = false;
      }
    }

    // 4. Check indexes for performance
    console.log('\n⚡ 4. INDEX CHECK');
    console.log('=================');
    
    const expectedIndexes = [
      'idx_referral_campaigns_active',
      'idx_user_wallets_user_id',
      'idx_point_release_delays_user_id',
      'idx_loyalty_networks_active',
      'idx_merchant_custom_nfts_merchant_id',
      'idx_discount_codes_merchant_id',
      'idx_loyalty_otp_codes_mobile',
      'idx_email_notifications_user_id'
    ];

    for (const indexName of expectedIndexes) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = $1
        `, [indexName]);

        const exists = parseInt(result.rows[0].count) > 0;
        
        if (exists) {
          results.indexes.found++;
          console.log(`✅ ${indexName}: EXISTS`);
        } else {
          results.indexes.missing++;
          console.log(`❌ ${indexName}: MISSING`);
          allChecksPassed = false;
        }
      } catch (err) {
        console.log(`❌ ${indexName}: ERROR - ${err.message}`);
        allChecksPassed = false;
      }
    }

    // 5. Check foreign key relationships
    console.log('\n🔗 5. FOREIGN KEY CHECK');
    console.log('=======================');
    
    const expectedFKs = [
      { table: 'user_wallets', column: 'user_id', references: 'profiles(id)' },
      { table: 'point_release_delays', column: 'user_id', references: 'profiles(id)' },
      { table: 'merchant_custom_nfts', column: 'merchant_id', references: 'merchants(id)' },
      { table: 'discount_codes', column: 'merchant_id', references: 'merchants(id)' }
    ];

    for (const fk of expectedFKs) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = 'public' 
          AND tc.table_name = $1
          AND kcu.column_name = $2
          AND tc.constraint_type = 'FOREIGN KEY'
        `, [fk.table, fk.column]);

        const exists = parseInt(result.rows[0].count) > 0;
        
        if (exists) {
          results.constraints.found++;
          console.log(`✅ ${fk.table}.${fk.column} → ${fk.references}: EXISTS`);
        } else {
          results.constraints.missing++;
          console.log(`❌ ${fk.table}.${fk.column} → ${fk.references}: MISSING`);
          allChecksPassed = false;
        }
      } catch (err) {
        console.log(`❌ ${fk.table}.${fk.column}: ERROR - ${err.message}`);
        allChecksPassed = false;
      }
    }

    // 6. Check specific application requirements
    console.log('\n🎯 6. APPLICATION REQUIREMENTS CHECK');
    console.log('=====================================');
    
    // Check loyalty number format support
    try {
      const result = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_cards'
        AND column_name = 'loyalty_number'
      `);
      
      if (result.rows.length > 0) {
        const col = result.rows[0];
        if (col.character_maximum_length >= 8) {
          console.log(`✅ Loyalty number format: Supports 8-character format (${col.character_maximum_length} max)`);
        } else {
          console.log(`❌ Loyalty number format: Too short (${col.character_maximum_length} max, need 8)`);
          allChecksPassed = false;
        }
      } else {
        console.log(`❌ Loyalty number column: NOT FOUND`);
        allChecksPassed = false;
      }
    } catch (err) {
      console.log(`❌ Loyalty number check: ERROR - ${err.message}`);
      allChecksPassed = false;
    }

    // Check OTP expiration support
    try {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'loyalty_otp_codes'
        AND column_name = 'expires_at'
      `);
      
      if (result.rows.length > 0) {
        console.log(`✅ OTP expiration: Timestamp support available`);
      } else {
        console.log(`❌ OTP expiration: Timestamp column missing`);
        allChecksPassed = false;
      }
    } catch (err) {
      console.log(`❌ OTP expiration check: ERROR - ${err.message}`);
      allChecksPassed = false;
    }

    // 7. Final summary
    console.log('\n📋 FINAL VERIFICATION SUMMARY');
    console.log('==============================');
    console.log(`Tables: ${results.tables.existing}/${results.tables.total} exist (${results.tables.missing} missing)`);
    console.log(`Data: ${results.data.withData}/${results.data.total} tables have data (${results.data.empty} empty)`);
    console.log(`Indexes: ${results.indexes.found}/${expectedIndexes.length} exist (${results.indexes.missing} missing)`);
    console.log(`Foreign Keys: ${results.constraints.found}/${expectedFKs.length} exist (${results.constraints.missing} missing)`);
    
    console.log('\n' + '='.repeat(50));
    
    if (allChecksPassed) {
      console.log('🎉 DATABASE VERIFICATION: ✅ COMPLETE');
      console.log('✅ All required tables exist');
      console.log('✅ All critical data is present');
      console.log('✅ Table structures are correct');
      console.log('✅ Indexes are in place');
      console.log('✅ Foreign key relationships exist');
      console.log('✅ Application requirements are met');
      console.log('\n🚀 Database is ready for production!');
    } else {
      console.log('⚠️  DATABASE VERIFICATION: ❌ INCOMPLETE');
      console.log('❌ Some requirements are not met');
      console.log('🔧 Please review the errors above and fix them');
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

// Run comprehensive check
comprehensiveCheck();
