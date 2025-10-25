import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function correctedRuntimeTest() {
  console.log('🎯 CORRECTED RUNTIME COMPLIANCE TEST\n');
  console.log(`📊 Database: ${localDbConfig.database}@${localDbConfig.host}:${localDbConfig.port}\n`);

  const client = new Client(localDbConfig);
  const results = {
    existingTables: { success: false, details: {} },
    profiles: { success: false, details: {} },
    merchants: { success: false, details: {} },
    dao: { success: false, details: {} }
  };

  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    // 1. Test Existing Tables
    console.log('1️⃣ Testing Existing Database Tables...');
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const tableNames = tablesResult.rows.map(row => row.table_name);
      console.log(`✅ Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
      
      results.existingTables = { success: true, details: { tables: tableNames } };
    } catch (error) {
      console.log(`❌ Tables test failed: ${error.message}`);
      results.existingTables = { success: false, details: { error: error.message } };
    }

    // 2. Test Profiles Table
    console.log('\n2️⃣ Testing Profiles Table...');
    try {
      const profilesResult = await client.query('SELECT COUNT(*) as count FROM profiles');
      const profilesCount = profilesResult.rows[0].count;
      console.log(`✅ Profiles table accessible: ${profilesCount} records`);
      
      // Test profile structure
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        ORDER BY ordinal_position
      `);
      
      console.log(`✅ Profiles table structure: ${structureResult.rows.length} columns`);
      results.profiles = { success: true, details: { count: profilesCount, columns: structureResult.rows.length } };
    } catch (error) {
      console.log(`❌ Profiles test failed: ${error.message}`);
      results.profiles = { success: false, details: { error: error.message } };
    }

    // 3. Test Merchant Subscription Plans
    console.log('\n3️⃣ Testing Merchant Subscription Plans...');
    try {
      const plansResult = await client.query('SELECT * FROM merchant_subscription_plans ORDER BY price');
      console.log(`✅ Retrieved ${plansResult.rows.length} merchant subscription plans`);
      
      plansResult.rows.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price} (${plan.points} points, ${plan.transactions} transactions)`);
      });
      
      results.merchants = { success: true, details: { count: plansResult.rows.length } };
    } catch (error) {
      console.log(`❌ Merchant plans test failed: ${error.message}`);
      results.merchants = { success: false, details: { error: error.message } };
    }

    // 4. Test DAO Tables
    console.log('\n4️⃣ Testing DAO Tables...');
    try {
      const daoMembersResult = await client.query('SELECT COUNT(*) as count FROM dao_members');
      const daoOrgsResult = await client.query('SELECT COUNT(*) as count FROM dao_organizations');
      const daoProposalsResult = await client.query('SELECT COUNT(*) as count FROM dao_proposals');
      const daoVotesResult = await client.query('SELECT COUNT(*) as count FROM dao_votes');
      
      console.log(`✅ DAO Members: ${daoMembersResult.rows[0].count} records`);
      console.log(`✅ DAO Organizations: ${daoOrgsResult.rows[0].count} records`);
      console.log(`✅ DAO Proposals: ${daoProposalsResult.rows[0].count} records`);
      console.log(`✅ DAO Votes: ${daoVotesResult.rows[0].count} records`);
      
      results.dao = { success: true, details: { 
        members: daoMembersResult.rows[0].count,
        organizations: daoOrgsResult.rows[0].count,
        proposals: daoProposalsResult.rows[0].count,
        votes: daoVotesResult.rows[0].count
      }};
    } catch (error) {
      console.log(`❌ DAO test failed: ${error.message}`);
      results.dao = { success: false, details: { error: error.message } };
    }

    // 5. Test Available Functions
    console.log('\n5️⃣ Testing Available Functions...');
    try {
      const functionsResult = await client.query(`
        SELECT routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        ORDER BY routine_name
      `);
      
      console.log(`✅ Found ${functionsResult.rows.length} functions:`);
      functionsResult.rows.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`);
      });
    } catch (error) {
      console.log(`❌ Functions test failed: ${error.message}`);
    }

    console.log('\n🎯 CORRECTED RUNTIME COMPLIANCE TEST SUMMARY:');
    console.log('==========================================');
    
    const passedTests = Object.values(results).filter(result => result.success).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([testName, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All available features are working correctly!');
    } else {
      console.log('⚠️ Some tests failed. Review the errors above.');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

correctedRuntimeTest().catch(console.error);

