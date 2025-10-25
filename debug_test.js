import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function debugTest() {
  console.log('🔍 DEBUG TEST - Check Exact Issues');
  console.log('===================================\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get valid IDs
    const existingUsers = await client.query('SELECT id FROM profiles LIMIT 1');
    const existingNftTypes = await client.query('SELECT id FROM nft_types LIMIT 1');
    
    const validUserId = existingUsers.rows[0]?.id;
    const validNftTypeId = existingNftTypes.rows[0]?.id;
    
    console.log(`User ID: ${validUserId}`);
    console.log(`NFT Type ID: ${validNftTypeId}\n`);
    
    // Test 1: Try to insert into user_nfts
    console.log('1️⃣ Testing user_nfts insert...');
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
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Test 2: Try to insert into user_loyalty_cards
    console.log('\n2️⃣ Testing user_loyalty_cards insert...');
    try {
      const loyaltyNumber = 'T' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      const insertResult = await client.query(`
        INSERT INTO user_loyalty_cards (
          user_id, nft_type_id, loyalty_number, card_number, 
          full_name, email, phone, points_balance, tier_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        validUserId,
        validNftTypeId,
        loyaltyNumber,
        'LC' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        'Test User',
        'test@example.com',
        '+1234567890',
        100,
        'bronze',
        true
      ]);
      
      console.log(`✅ Success: Created loyalty card: ${insertResult.rows[0].id}`);
      
      // Cleanup
      await client.query('DELETE FROM user_loyalty_cards WHERE id = $1', [insertResult.rows[0].id]);
      console.log('✅ Cleaned up');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Test 3: Try to insert into asset_investments
    console.log('\n3️⃣ Testing asset_investments insert...');
    try {
      const existingInitiatives = await client.query('SELECT id FROM asset_initiatives LIMIT 1');
      const validInitiativeId = existingInitiatives.rows[0]?.id;
      
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
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Test 4: Try to insert into referral_campaigns
    console.log('\n4️⃣ Testing referral_campaigns insert...');
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
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

debugTest().catch(console.error);

