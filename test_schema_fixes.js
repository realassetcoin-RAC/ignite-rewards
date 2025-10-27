import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function testSchemaFixes() {
  console.log('🧪 Testing Schema Fixes - Comprehensive Verification');
  console.log('==================================================\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');
    
    let testResults = {
      assetInitiatives: { passed: 0, total: 0, details: [] },
      assetInvestments: { passed: 0, total: 0, details: [] },
      newTables: { passed: 0, total: 0, details: [] },
      overall: { passed: 0, total: 0 }
    };
    
    // Test 1: Asset Initiatives Schema
    console.log('1️⃣ Testing Asset Initiatives Schema...');
    const assetInitiativesColumns = [
      'id', 'name', 'description', 'category', 'icon', 'is_active', 'created_at', 'updated_at',
      'impact_score', 'risk_level', 'expected_return', 'min_investment', 'max_investment',
      'current_funding', 'target_funding', 'image_url', 'website_url',
      'multi_sig_wallet_address', 'multi_sig_threshold', 'multi_sig_signers',
      'blockchain_network', 'supported_currencies', 'is_web3_enabled',
      'hot_wallet_address', 'cold_wallet_address'
    ];
    
    for (const column of assetInitiativesColumns) {
      testResults.assetInitiatives.total++;
      try {
        const result = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'asset_initiatives' 
          AND column_name = $1
        `, [column]);
        
        if (result.rows.length > 0) {
          testResults.assetInitiatives.passed++;
          testResults.assetInitiatives.details.push(`✅ ${column}: ${result.rows[0].data_type}`);
        } else {
          testResults.assetInitiatives.details.push(`❌ ${column}: MISSING`);
        }
      } catch (error) {
        testResults.assetInitiatives.details.push(`❌ ${column}: ERROR - ${error.message}`);
      }
    }
    
    // Test 2: Asset Investments Schema
    console.log('\n2️⃣ Testing Asset Investments Schema...');
    const assetInvestmentsColumns = [
      'id', 'user_id', 'asset_initiative_id', 'investment_amount', 'currency_type',
      'investment_type', 'status', 'wallet_address', 'transaction_hash',
      'blockchain_network', 'from_wallet_address', 'to_wallet_address',
      'current_value', 'total_returns', 'return_percentage', 'invested_at',
      'confirmed_at', 'created_at', 'updated_at'
    ];
    
    for (const column of assetInvestmentsColumns) {
      testResults.assetInvestments.total++;
      try {
        const result = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'asset_investments' 
          AND column_name = $1
        `, [column]);
        
        if (result.rows.length > 0) {
          testResults.assetInvestments.passed++;
          testResults.assetInvestments.details.push(`✅ ${column}: ${result.rows[0].data_type}`);
        } else {
          testResults.assetInvestments.details.push(`❌ ${column}: MISSING`);
        }
      } catch (error) {
        testResults.assetInvestments.details.push(`❌ ${column}: ERROR - ${error.message}`);
      }
    }
    
    // Test 3: New Tables
    console.log('\n3️⃣ Testing New Tables...');
    const newTables = [
      'user_wallet_connections',
      'rac_conversions', 
      'investment_returns'
    ];
    
    for (const table of newTables) {
      testResults.newTables.total++;
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults.newTables.passed++;
          testResults.newTables.details.push(`✅ ${table}: EXISTS`);
        } else {
          testResults.newTables.details.push(`❌ ${table}: MISSING`);
        }
      } catch (error) {
        testResults.newTables.details.push(`❌ ${table}: ERROR - ${error.message}`);
      }
    }
    
    // Test 4: Data Insertion Test
    console.log('\n4️⃣ Testing Data Insertion...');
    try {
      // Get a valid user ID
      const userResult = await client.query('SELECT id FROM profiles LIMIT 1');
      const validUserId = userResult.rows[0]?.id;
      
      if (validUserId) {
        // Test asset initiative insertion
        const initiativeResult = await client.query(`
          INSERT INTO asset_initiatives (
            name, description, category, impact_score, risk_level, 
            expected_return, min_investment, max_investment, 
            current_funding, target_funding, is_active, is_web3_enabled
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          'Test Initiative', 'Test description', 'environmental', 8, 'medium',
          7.5, 100, 10000, 0, 100000, true, true
        ]);
        
        const initiativeId = initiativeResult.rows[0].id;
        console.log(`✅ Created test asset initiative: ${initiativeId}`);
        
        // Test asset investment insertion
        const investmentResult = await client.query(`
          INSERT INTO asset_investments (
            user_id, asset_initiative_id, investment_amount, currency_type,
            investment_type, status, wallet_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          validUserId, initiativeId, 500, 'USDT', 'direct_web3', 'pending', 'test-wallet-123'
        ]);
        
        const investmentId = investmentResult.rows[0].id;
        console.log(`✅ Created test investment: ${investmentId}`);
        
        // Test user wallet connection insertion
        const walletResult = await client.query(`
          INSERT INTO user_wallet_connections (
            user_id, wallet_address, wallet_type, blockchain_network,
            connection_method, verification_status, is_primary, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          validUserId, 'test-wallet-456', 'metamask', 'ethereum',
          'signature', 'verified', true, true
        ]);
        
        const walletId = walletResult.rows[0].id;
        console.log(`✅ Created test wallet connection: ${walletId}`);
        
        // Test RAC conversion insertion
        const conversionResult = await client.query(`
          INSERT INTO rac_conversions (
            user_id, rac_amount, target_currency, converted_amount,
            exchange_rate, dex_provider, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          validUserId, 1000, 'USDT', 100, 0.1, 'uniswap', 'completed'
        ]);
        
        const conversionId = conversionResult.rows[0].id;
        console.log(`✅ Created test RAC conversion: ${conversionId}`);
        
        // Test investment return insertion
        const returnResult = await client.query(`
          INSERT INTO investment_returns (
            investment_id, return_amount, return_percentage, return_date, return_type
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          investmentId, 25, 5.0, new Date().toISOString(), 'dividend'
        ]);
        
        const returnId = returnResult.rows[0].id;
        console.log(`✅ Created test investment return: ${returnId}`);
        
        // Cleanup test data
        await client.query('DELETE FROM investment_returns WHERE id = $1', [returnId]);
        await client.query('DELETE FROM rac_conversions WHERE id = $1', [conversionId]);
        await client.query('DELETE FROM user_wallet_connections WHERE id = $1', [walletId]);
        await client.query('DELETE FROM asset_investments WHERE id = $1', [investmentId]);
        await client.query('DELETE FROM asset_initiatives WHERE id = $1', [initiativeId]);
        
        console.log('✅ Cleaned up test data');
        testResults.overall.passed++;
      } else {
        console.log('❌ No valid user found for testing');
        testResults.overall.passed = 0;
      }
    } catch (error) {
      console.log(`❌ Data insertion test failed: ${error.message}`);
      testResults.overall.passed = 0;
    }
    
    testResults.overall.total = 1;
    
    // Summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    
    console.log(`\nAsset Initiatives: ${testResults.assetInitiatives.passed}/${testResults.assetInitiatives.total} columns`);
    testResults.assetInitiatives.details.forEach(detail => console.log(`  ${detail}`));
    
    console.log(`\nAsset Investments: ${testResults.assetInvestments.passed}/${testResults.assetInvestments.total} columns`);
    testResults.assetInvestments.details.forEach(detail => console.log(`  ${detail}`));
    
    console.log(`\nNew Tables: ${testResults.newTables.passed}/${testResults.newTables.total} tables`);
    testResults.newTables.details.forEach(detail => console.log(`  ${detail}`));
    
    console.log(`\nData Operations: ${testResults.overall.passed}/${testResults.overall.total} tests`);
    
    const totalPassed = testResults.assetInitiatives.passed + testResults.assetInvestments.passed + 
                       testResults.newTables.passed + testResults.overall.passed;
    const totalTests = testResults.assetInitiatives.total + testResults.assetInvestments.total + 
                      testResults.newTables.total + testResults.overall.total;
    
    console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalPassed === totalTests) {
      console.log('\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉');
      console.log('✅ Database schema gaps have been successfully fixed!');
      console.log('✅ Frontend-backend alignment is complete!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the details above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Please ensure:');
    console.log('   - Docker Desktop is running');
    console.log('   - PostgreSQL container is running');
    console.log('   - Database migration has been applied');
  } finally {
    await client.end();
  }
}

testSchemaFixes().catch(console.error);
