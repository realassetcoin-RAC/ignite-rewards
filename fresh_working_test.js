import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function freshWorkingTest() {
  console.log('🎯 FRESH WORKING TEST - Use Actual Verified Schemas');
  console.log('==================================================\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get valid IDs
    const existingUsers = await client.query('SELECT id FROM profiles LIMIT 1');
    const existingNftTypes = await client.query('SELECT id FROM nft_types LIMIT 1');
    const existingNetworks = await client.query('SELECT id FROM loyalty_networks LIMIT 1');
    const existingInitiatives = await client.query('SELECT id FROM asset_initiatives LIMIT 1');
    
    const validUserId = existingUsers.rows[0]?.id;
    const validNftTypeId = existingNftTypes.rows[0]?.id;
    const validNetworkId = existingNetworks.rows[0]?.id;
    const validInitiativeId = existingInitiatives.rows[0]?.id;
    
    console.log(`User ID: ${validUserId}`);
    console.log(`NFT Type ID: ${validNftTypeId}`);
    console.log(`Network ID: ${validNetworkId}`);
    console.log(`Initiative ID: ${validInitiativeId}\n`);
    
    let successCount = 0;
    let totalTests = 0;
    
    // Test 1: Loyalty Cards - Use simple approach
    console.log('1️⃣ Testing Loyalty Cards...');
    totalTests++;
    try {
      const loyaltyNumber = 'T' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      const insertResult = await client.query(`
        INSERT INTO user_loyalty_cards (
          user_id, nft_type_id, loyalty_number, card_number, 
          full_name, email, points_balance, tier_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        validUserId,
        validNftTypeId,
        loyaltyNumber,
        'LC' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        'Test User',
        'test@example.com',
        100,
        'bronze',
        true
      ]);
      
      console.log(`✅ Success: Created loyalty card: ${insertResult.rows[0].id}`);
      
      // Cleanup
      await client.query('DELETE FROM user_loyalty_cards WHERE id = $1', [insertResult.rows[0].id]);
      console.log('✅ Cleaned up');
      successCount++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Test 2: NFT Operations - Use simple approach
    console.log('\n2️⃣ Testing NFT Operations...');
    totalTests++;
    try {
      const insertResult = await client.query(`
        INSERT INTO user_nfts (
          user_id, nft_type_id, is_active
        ) VALUES ($1, $2, true)
        RETURNING id
      `, [validUserId, validNftTypeId]);
      
      console.log(`✅ Success: Created user NFT: ${insertResult.rows[0].id}`);
      
      // Cleanup
      await client.query('DELETE FROM user_nfts WHERE id = $1', [insertResult.rows[0].id]);
      console.log('✅ Cleaned up');
      successCount++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Test 3: Investment Features - Use simple approach
    console.log('\n3️⃣ Testing Investment Features...');
    totalTests++;
    try {
      const insertResult = await client.query(`
        INSERT INTO asset_investments (
          user_id, asset_initiative_id, investment_amount, status, wallet_address
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [validUserId, validInitiativeId, 100.50, 'pending', 'test-wallet-address']);
      
      console.log(`✅ Success: Created investment: ${insertResult.rows[0].id}`);
      
      // Cleanup
      await client.query('DELETE FROM asset_investments WHERE id = $1', [insertResult.rows[0].id]);
      console.log('✅ Cleaned up');
      successCount++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Test 4: Referral Campaigns - Use simple approach
    console.log('\n4️⃣ Testing Referral Campaigns...');
    totalTests++;
    try {
      const insertResult = await client.query(`
        INSERT INTO referral_campaigns (
          name, description, reward_amount, is_active
        ) VALUES ($1, $2, $3, true)
        RETURNING id
      `, ['Test Campaign', 'Test referral campaign', 25.00]);
      
      console.log(`✅ Success: Created campaign: ${insertResult.rows[0].id}`);
      
      // Cleanup
      await client.query('DELETE FROM referral_campaigns WHERE id = $1', [insertResult.rows[0].id]);
      console.log('✅ Cleaned up');
      successCount++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(`\n🎯 Results: ${successCount}/${totalTests} tests passed`);
    
    if (successCount === totalTests) {
      console.log('🎉🎉🎉 100% SUCCESS ACHIEVED! 🎉🎉🎉');
      console.log('✅ All schema mismatches have been resolved!');
    } else {
      console.log('⚠️ Some tests still failed. The issue may be deeper than schema mismatches.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

freshWorkingTest().catch(console.error);
