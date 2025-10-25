import { Client } from 'pg';

// Local PostgreSQL database configuration
const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function verifyLocalDatabaseGaps() {
  console.log('🔍 Verifying form database gaps in LOCAL PostgreSQL database...\n');
  console.log(`📊 Database: ${localDbConfig.database}@${localDbConfig.host}:${localDbConfig.port}\n`);

  const client = new Client(localDbConfig);
  const results = {
    profiles: { success: false, columns: [], missing: [] },
    merchants: { success: false, columns: [], missing: [] },
    newTables: { success: false, tables: [], missing: [] }
  };

  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    // 1. Check profiles table columns
    console.log('1️⃣ Checking profiles table columns...');
    try {
      const profilesQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles'
        ORDER BY ordinal_position;
      `;
      
      const profilesResult = await client.query(profilesQuery);
      const actualColumns = profilesResult.rows.map(row => row.column_name);
      
      const expectedColumns = [
        'id', 'email', 'full_name', 'avatar_url', 'role', 'created_at', 'updated_at',
        'phone', 'city', 'referral_code', 'terms_accepted', 'privacy_accepted',
        'loyalty_card_number', 'first_name', 'last_name', 'wallet_address'
      ];
      
      results.profiles.columns = actualColumns;
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      results.profiles.missing = missingColumns;
      
      if (missingColumns.length === 0) {
        results.profiles.success = true;
        console.log('✅ All expected columns found in profiles table');
      } else {
        console.log('❌ Missing columns in profiles table:', missingColumns);
      }
      
      console.log(`📊 Current columns: ${actualColumns.join(', ')}\n`);
    } catch (error) {
      console.log('❌ Error checking profiles table:', error.message);
    }

    // 2. Check merchants table columns
    console.log('2️⃣ Checking merchants table columns...');
    try {
      const merchantsQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'merchants'
        ORDER BY ordinal_position;
      `;
      
      const merchantsResult = await client.query(merchantsQuery);
      const actualColumns = merchantsResult.rows.map(row => row.column_name);
      
      const expectedColumns = [
        'id', 'user_id', 'business_name', 'business_type', 'contact_email', 'phone',
        'address', 'city', 'country', 'subscription_plan', 'status', 'created_at', 'updated_at',
        'contact_name', 'website', 'terms_accepted', 'privacy_accepted', 'free_trial_months'
      ];
      
      results.merchants.columns = actualColumns;
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      results.merchants.missing = missingColumns;
      
      if (missingColumns.length === 0) {
        results.merchants.success = true;
        console.log('✅ All expected columns found in merchants table');
      } else {
        console.log('❌ Missing columns in merchants table:', missingColumns);
      }
      
      console.log(`📊 Current columns: ${actualColumns.join(', ')}\n`);
    } catch (error) {
      console.log('❌ Error checking merchants table:', error.message);
    }

    // 3. Check new tables exist
    console.log('3️⃣ Checking new tables exist...');
    const expectedTables = [
      'contact_categories', 'contact_tags', 'contact_conversations', 'contact_tickets', 'contact_messages',
      'loyalty_change_requests', 'marketplace_listings', 'marketplace_investments',
      'asset_initiatives', 'asset_investments', 'user_wallets', 'user_referrals',
      'referral_campaigns', 'user_points', 'loyalty_transactions'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of expectedTables) {
      try {
        const tableQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1;
        `;
        
        const tableResult = await client.query(tableQuery, [tableName]);
        
        if (tableResult.rows.length > 0) {
          existingTables.push(tableName);
        } else {
          missingTables.push(tableName);
        }
      } catch (error) {
        missingTables.push(tableName);
      }
    }

    results.newTables.tables = existingTables;
    results.newTables.missing = missingTables;

    if (missingTables.length === 0) {
      results.newTables.success = true;
      console.log('✅ All expected tables exist');
    } else {
      console.log('❌ Missing tables:', missingTables);
    }

    console.log(`📊 Existing tables: ${existingTables.join(', ')}\n`);

    // 4. Check existing tables in database
    console.log('4️⃣ Checking all existing tables in database...');
    try {
      const allTablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      
      const allTablesResult = await client.query(allTablesQuery);
      const allTables = allTablesResult.rows.map(row => row.table_name);
      
      console.log(`📊 All tables in database: ${allTables.join(', ')}\n`);
    } catch (error) {
      console.log('❌ Error getting all tables:', error.message);
    }

    // 5. Summary
    console.log('📊 VERIFICATION SUMMARY:');
    console.log('================================');
    
    if (results.profiles.success) {
      console.log('✅ Profiles table: All columns present');
    } else {
      console.log('❌ Profiles table: Missing columns:', results.profiles.missing);
    }
    
    if (results.merchants.success) {
      console.log('✅ Merchants table: All columns present');
    } else {
      console.log('❌ Merchants table: Missing columns:', results.merchants.missing);
    }
    
    if (results.newTables.success) {
      console.log('✅ New tables: All tables created');
    } else {
      console.log('❌ New tables: Missing tables:', results.newTables.missing);
    }

    const overallSuccess = results.profiles.success && results.merchants.success && results.newTables.success;
    
    if (overallSuccess) {
      console.log('\n🎉 ALL FORM DATABASE GAPS HAVE BEEN FIXED IN LOCAL DATABASE!');
      console.log('🚀 The local database is now fully aligned with all application forms.');
    } else {
      console.log('\n⚠️  Some gaps still remain in the local database.');
      console.log('📋 Run the local database fix script to resolve these issues.');
    }

    return results;

  } catch (error) {
    console.log('❌ Error connecting to local database:', error.message);
    console.log('🔧 Please ensure:');
    console.log('   - PostgreSQL is running on localhost:5432');
    console.log('   - Database "ignite_rewards" exists');
    console.log('   - User "postgres" has access');
    console.log('   - Password is correct');
    return results;
  } finally {
    await client.end();
  }
}

verifyLocalDatabaseGaps();
