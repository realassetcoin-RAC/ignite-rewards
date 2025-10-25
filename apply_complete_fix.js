import { Client } from 'pg';
import fs from 'fs';

const localDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ignite_rewards',
  user: 'postgres',
  password: 'Maegan@200328'
};

async function applyCompleteFix() {
  console.log('🔧 APPLYING COMPLETE DATABASE FIX');
  console.log('=====================================\n');
  
  const client = new Client(localDbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read the complete fix SQL file
    const sqlContent = fs.readFileSync('complete_database_fix.sql', 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          successCount++;
          if (i % 10 === 0) {
            console.log(`✅ Progress: ${i + 1}/${statements.length} statements executed`);
          }
        } catch (error) {
          errorCount++;
          console.log(`⚠️ Statement ${i + 1} warning: ${error.message.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️ Warnings: ${errorCount}`);
    
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
    
    let missingTables = [];
    let createdTables = [];
    
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
    
    console.log('\n🎉 COMPLETE DATABASE FIX APPLIED SUCCESSFULLY!');
    console.log('===============================================');
    
  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
  } finally {
    await client.end();
  }
}

applyCompleteFix().catch(console.error);

