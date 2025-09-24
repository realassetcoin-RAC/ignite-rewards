// Comprehensive database status check
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveCheck() {
  console.log('🔍 Comprehensive Database Status Check');
  console.log('=====================================');
  
  const tables = [
    'profiles',
    'merchants', 
    'nft_types',
    'nft_collections',
    'nft_minting_control',
    'user_loyalty_cards',
    'merchant_subscription_plans',
    'referral_campaigns',
    'loyalty_transactions'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results[table] = { status: 'error', error: error.message };
      } else {
        console.log(`✅ ${table}: Accessible`);
        results[table] = { status: 'ok', data: data };
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      results[table] = { status: 'error', error: err.message };
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  
  const accessible = Object.values(results).filter(r => r.status === 'ok').length;
  const total = tables.length;
  
  console.log(`✅ Accessible tables: ${accessible}/${total}`);
  console.log(`❌ Failed tables: ${total - accessible}/${total}`);
  
  if (accessible === 0) {
    console.log('\n🚨 CRITICAL: No tables are accessible!');
    console.log('📋 This suggests:');
    console.log('   1. Database migration failed');
    console.log('   2. Database is in maintenance mode');
    console.log('   3. Supabase service is down');
    console.log('   4. RLS policies are blocking access');
  } else if (accessible < total) {
    console.log('\n⚠️  PARTIAL: Some tables are missing!');
    console.log('📋 Missing tables need to be created via migration');
  } else {
    console.log('\n✅ SUCCESS: All tables are accessible!');
  }
  
  return results;
}

comprehensiveCheck();

