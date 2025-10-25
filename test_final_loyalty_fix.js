import { Client } from 'pg';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function testFinalLoyaltyFix() {
  console.log('🔧 Testing Final Loyalty Card Fix...\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL database\n');

    // Get existing valid IDs
    const existingUsers = await client.query('SELECT id FROM profiles LIMIT 1');
    const existingNftTypes = await client.query('SELECT id FROM nft_types LIMIT 1');
    
    const validUserId = existingUsers.rows[0]?.id || '00000000-0000-0000-0000-000000000001';
    const validNftTypeId = existingNftTypes.rows[0]?.id || '00000000-0000-0000-0000-000000000002';
    
    console.log(`✅ Using valid IDs: User=${validUserId}, NFT=${validNftTypeId}\n`);

    // Test loyalty number generation
    const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['test@example.com']);
    const loyaltyNumber = loyaltyNumberResult.rows[0].loyalty_number;
    console.log(`✅ Generated loyalty number: ${loyaltyNumber}`);

    // Test loyalty card creation with explicit column names to avoid ambiguity
    const insertResult = await client.query(`
      INSERT INTO user_loyalty_cards (
        user_id, nft_type_id, loyalty_number, card_number, 
        full_name, email, phone, points_balance, tier_level, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, loyalty_number, card_number
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

    const loyaltyCard = insertResult.rows[0];
    console.log(`✅ Created loyalty card: ${loyaltyCard.id} - ${loyaltyCard.loyalty_number}`);

    // Test loyalty card retrieval with explicit table alias
    const selectResult = await client.query(`
      SELECT ulc.id, ulc.loyalty_number, ulc.card_number, ulc.full_name, ulc.email
      FROM user_loyalty_cards ulc 
      WHERE ulc.id = $1
    `, [loyaltyCard.id]);
    
    console.log(`✅ Retrieved loyalty card: ${selectResult.rows[0].full_name}`);

    // Cleanup
    await client.query('DELETE FROM user_loyalty_cards WHERE id = $1', [loyaltyCard.id]);
    console.log('✅ Cleaned up test loyalty card');

    console.log('\n🎉 LOYALTY CARD TEST PASSED! All operations working correctly.');

  } catch (error) {
    console.log('❌ Loyalty card test failed:', error.message);
  } finally {
    await client.end();
  }
}

testFinalLoyaltyFix();

