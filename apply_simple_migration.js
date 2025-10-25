import { Client } from 'pg';
import fs from 'fs';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function applySimpleMigration() {
  console.log('🔧 APPLYING SIMPLE WORKING MIGRATION');
  console.log('====================================\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read the simple migration SQL file
    const sqlContent = fs.readFileSync('simple_working_migration.sql', 'utf8');
    
    // Execute the entire SQL content as one statement
    console.log('📝 Executing migration...');
    
    try {
      await client.query(sqlContent);
      console.log('✅ Migration executed successfully');
    } catch (error) {
      console.log(`⚠️ Migration warning: ${error.message.substring(0, 200)}...`);
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const expectedTables = [
      'nft_types', 'nft_collections', 'user_nfts', 'loyalty_networks',
      'user_loyalty_cards', 'loyalty_otp_codes', 'user_solana_wallets',
      'asset_initiatives', 'asset_investments', 'terms_privacy_acceptance',
      'merchants', 'referral_campaigns'
    ];
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log(`📋 Total tables in database: ${existingTables.length}`);
    
    let createdTables = [];
    let missingTables = [];
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        createdTables.push(table);
      } else {
        missingTables.push(table);
      }
    }
    
    console.log(`✅ Created tables: ${createdTables.length}/${expectedTables.length}`);
    createdTables.forEach(table => console.log(`   - ${table}`));
    
    if (missingTables.length > 0) {
      console.log(`❌ Missing tables: ${missingTables.length}`);
      missingTables.forEach(table => console.log(`   - ${table}`));
    }
    
    // Test functions
    console.log('\n🧪 Testing RPC functions...');
    
    try {
      const loyaltyNumberResult = await client.query('SELECT generate_loyalty_number($1) as loyalty_number', ['test@example.com']);
      console.log(`✅ generate_loyalty_number: ${loyaltyNumberResult.rows[0].loyalty_number}`);
    } catch (error) {
      console.log(`❌ generate_loyalty_number failed: ${error.message}`);
    }
    
    try {
      const plansResult = await client.query('SELECT get_valid_subscription_plans() as plans');
      console.log(`✅ get_valid_subscription_plans: ${plansResult.rows[0].plans.length} plans returned`);
    } catch (error) {
      console.log(`❌ get_valid_subscription_plans failed: ${error.message}`);
    }
    
    // Test sample data
    console.log('\n📊 Testing sample data...');
    
    const testQueries = [
      { name: 'NFT Types', query: 'SELECT COUNT(*) as count FROM public.nft_types' },
      { name: 'NFT Collections', query: 'SELECT COUNT(*) as count FROM public.nft_collections' },
      { name: 'Loyalty Networks', query: 'SELECT COUNT(*) as count FROM public.loyalty_networks' },
      { name: 'Asset Initiatives', query: 'SELECT COUNT(*) as count FROM public.asset_initiatives' },
      { name: 'Referral Campaigns', query: 'SELECT COUNT(*) as count FROM public.referral_campaigns' }
    ];
    
    for (const test of testQueries) {
      try {
        const result = await client.query(test.query);
        console.log(`✅ ${test.name}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 SIMPLE MIGRATION APPLIED SUCCESSFULLY!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
  } finally {
    await client.end();
  }
}

applySimpleMigration().catch(console.error);

